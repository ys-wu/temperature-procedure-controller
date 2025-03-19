from abc import ABC, abstractmethod
import serial
import asyncio
from typing import Callable, TypeVar, ParamSpec
from decimal import Decimal
from model import Temperature
from functools import wraps

P = ParamSpec("P")
T = TypeVar("T")


def crc16(data: bytes) -> bytes:
    crc = 0xFFFF
    for pos in data:
        crc ^= pos
        for _ in range(8):
            if crc & 1:
                crc >>= 1
                crc ^= 0xA001
            else:
                crc >>= 1
    return crc.to_bytes(2, byteorder="little")


def require_connection(func: Callable[P, T]) -> Callable[P, T]:
    @wraps(func)
    async def wrapper(self: "SerialDevice", *args: P.args, **kwargs: P.kwargs) -> T:
        if not await self.is_connected():
            raise ConnectionError("Device is not connected")
        return await func(self, *args, **kwargs)

    return wrapper


class SerialDevice(ABC):
    @abstractmethod
    async def connect(self, port: str) -> None:
        pass

    @abstractmethod
    async def disconnect(self) -> None:
        pass

    @abstractmethod
    async def read_temperature(self) -> Temperature:
        pass

    @abstractmethod
    async def set_temperature(self, temperature: Temperature) -> None:
        pass

    @abstractmethod
    async def is_connected(self) -> bool:
        pass

    @abstractmethod
    async def status(self) -> dict[str, float | str]:
        pass


class RealSerialDevice(SerialDevice):
    def __init__(self, port: str, device_id: int = 1):
        self._serial: serial.Serial | None = None
        self._port = port
        self._device_id = device_id
        self._target_temp: Temperature = Temperature(value=Decimal("0"))
        self._current_temp: Temperature = Temperature(value=Decimal("0"))
        self._lock = False

    async def connect(self) -> None:
        try:
            while self._lock:
                await asyncio.sleep(0.01)

            self._serial = serial.Serial(
                port=self._port,
                baudrate=9600,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_TWO,
                bytesize=serial.EIGHTBITS,
                timeout=1,
            )
            self._lock = False
        except serial.SerialException as e:
            self._lock = False
            raise ConnectionError(
                f"Failed to connect to device on port {self._port}: {str(e)}"
            )

    async def disconnect(self) -> None:
        while self._lock:
            await asyncio.sleep(0.01)

        if self._serial and self._serial.is_open:
            self._serial.close()

        self._lock = False
        self._serial = None

    @require_connection
    async def read_temperature(self) -> Temperature:
        try:
            while self._lock:
                await asyncio.sleep(0.01)

            # Modbus RTU read holding registers command
            start_address = 0x2000  # Address for PV (process value)
            num_of_registers = 3
            message = bytearray(
                [
                    self._device_id,
                    0x03,  # Function code for reading holding registers
                    start_address >> 8,
                    start_address & 0xFF,
                    num_of_registers >> 8,
                    num_of_registers & 0xFF,
                ]
            )
            message += crc16(message)

            self._serial.write(message)
            # await asyncio.sleep(0.01)  # Wait for response

            response = self._serial.read(11)
            if len(response) != 11:
                raise IOError("Invalid response length")

            # Parse response
            meas_temp = int.from_bytes(response[3:5], byteorder="big")
            temp_value = Decimal(str(meas_temp / 10.0))  # Convert to correct scale
            self._current_temp = Temperature(value=temp_value)

            target_temp = int.from_bytes(response[7:9], byteorder="big")
            traget_value = Decimal(str(target_temp / 10.0))  # Convert to correct scale
            self._target_temp = Temperature(value=traget_value)

            self._lock = False
            return self._current_temp

        except (serial.SerialException, ValueError) as e:
            self._lock = False
            raise IOError(f"Failed to read temperature: {str(e)}")

    @require_connection
    async def set_temperature(self, temperature: Temperature) -> None:
        try:
            while self._lock:
                await asyncio.sleep(0.01)

            # Modbus RTU write single register command
            address = 0x0001  # Address for SP (set point)
            value = int(temperature.celsius * 10)  # Convert to correct scale

            message = bytearray(
                [
                    self._device_id,
                    0x06,  # Function code for writing single register
                    address >> 8,
                    address & 0xFF,
                    value >> 8,
                    value & 0xFF,
                ]
            )
            message += crc16(message)

            self._serial.write(message)
            # await asyncio.sleep(0.01)  # Wait for response

            response = self._serial.read(8)
            if len(response) != 8:
                raise IOError("Invalid response length")

            self._target_temp = temperature
            self._lock = False

        except serial.SerialException as e:
            self._lock = False
            raise IOError(f"Failed to set temperature: {str(e)}")

    async def is_connected(self) -> bool:
        return self._serial is not None and self._serial.is_open

    async def status(self) -> dict[str, float | str]:
        if not await self.is_connected():
            return {
                "temperature_setpoint": 0.0,
                "temperature_actual": 0.0,
                "temperature_status": "Disconnected",
            }

        try:
            await self.read_temperature()
            return {
                "temperature_setpoint": self._target_temp.float_celsius,
                "temperature_actual": self._current_temp.float_celsius,
                "temperature_status": "OK",
            }
        except Exception as e:
            return {
                "temperature_setpoint": self._target_temp.float_celsius,
                "temperature_actual": self._current_temp.float_celsius,
                "temperature_status": f"Error: {str(e)}",
            }


class MockSerialDevice(SerialDevice):
    def __init__(
        self,
        target_temp: Temperature | float | int | None = None,
        current_temp: Temperature | float | int | None = None,
        connected: bool = True,
    ):
        self._connected = connected
        self._current_temp = self._to_temperature(current_temp or 0)
        self._target_temp = self._to_temperature(target_temp or 0)

    def _to_temperature(self, value: Temperature | int | float | None) -> Temperature:
        if isinstance(value, Temperature):
            return value
        if value is None:
            value = 0
        return Temperature(value=Decimal(str(value)))

    def _update_temperature(self) -> None:
        self._current_temp += (self._target_temp - self._current_temp) / 10

    async def connect(self, port: str) -> None:
        self._connected = True

    async def disconnect(self) -> None:
        self._connected = False

    @require_connection
    async def read_temperature(self) -> Temperature:
        return self._current_temp

    @require_connection
    async def set_temperature(self, temperature: Temperature) -> None:
        self._target_temp = temperature

    async def is_connected(self) -> bool:
        return self._connected

    async def status(self) -> dict[str, float | str]:
        self._update_temperature()
        return {
            "temperature_setpoint": self._target_temp.float_celsius,
            "temperature_actual": self._current_temp.float_celsius,
            "temperature_status": "OK",
        }

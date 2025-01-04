from abc import ABC, abstractmethod
import serial
from typing import Optional, Callable, TypeVar, ParamSpec, Union
from decimal import Decimal
from model import Temperature
from functools import wraps

P = ParamSpec("P")
T = TypeVar("T")


def require_connection(func: Callable[P, T]) -> Callable[P, T]:
    @wraps(func)
    async def wrapper(self: SerialDevice, *args: P.args, **kwargs: P.kwargs) -> T:
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
    async def status(self) -> dict:
        pass


class RealSerialDevice(SerialDevice):
    def __init__(self, port: str):
        self._serial: Optional[serial.Serial] = None
        self._port = port

    async def connect(self) -> None:
        try:
            self._serial = serial.Serial(
                port=self._port,
                baudrate=9600,
                timeout=1,
            )
        except serial.SerialException as e:
            raise ConnectionError(
                f"Failed to connect to device on port {self._port}: {str(e)}"
            )

    async def disconnect(self) -> None:
        if self.is_connected:
            self._serial.close()
        self._serial = None

    @require_connection
    async def read_temperature(self) -> Temperature:
        try:
            self._serial.write(b"READ_TEMP\n")
            response = self._serial.readline().decode().strip()
            temp_value = Decimal(response)
            return Temperature(value=temp_value)
        except (serial.SerialException, ValueError) as e:
            raise IOError(f"Failed to read temperature: {str(e)}")

    @require_connection
    async def set_temperature(self, temperature: Temperature) -> None:
        try:
            command = f"SET_TEMP {temperature.celsius}\n"
            self._serial.write(command.encode())
            response = self._serial.readline().decode().strip()
            if response != "OK":
                raise IOError(f"Device rejected temperature setting: {response}")
        except serial.SerialException as e:
            raise IOError(f"Failed to set temperature: {str(e)}")

    @property
    async def is_connected(self) -> bool:
        return self._serial is not None and self._serial.is_open

    @property
    def status(self) -> dict:
        return {
            "temperature_setpoint": self._target_temp.float_celsius,
            "temperature_actual": self._current_temp.float_celsius,
            "temperature_status": "OK",
        }


class MockSerialDevice(SerialDevice):
    def __init__(
        self,
        target_temp: Temperature = None,
        current_temp: Temperature = None,
        connected: bool = True,
    ):
        self._connected = connected
        self._current_temp = self._to_temperature(current_temp)
        self._target_temp = self._to_temperature(target_temp)

    def _to_temperature(self, value: Union[Temperature, int, float]) -> Temperature:
        if isinstance(value, Temperature):
            return value
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

    @property
    def status(self) -> dict:
        self._update_temperature()
        return {
            "temperature_setpoint": self._target_temp.float_celsius,
            "temperature_actual": self._current_temp.float_celsius,
            "temperature_status": "OK",
        }

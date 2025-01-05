from typing import Union
from dataclasses import dataclass
from decimal import Decimal
import uuid


@dataclass(frozen=True)
class Temperature:
    value: Decimal

    def __post_init__(self):
        if not isinstance(self.value, Decimal):
            object.__setattr__(self, "value", Decimal(str(self.value)))

    @property
    def celsius(self) -> Decimal:
        return self.value

    @property
    def float_celsius(self) -> float:
        return float(self.celsius)

    def __str__(self) -> str:
        return f"{self.value}°C"

    def _check_temperature_type(self, other: "Temperature", operation: str) -> None:
        if not isinstance(other, Temperature):
            raise TypeError(
                f"unsupported operand type(s) for {operation}: '{type(self).__name__}' and '{type(other).__name__}'"
            )

    def _check_number_type(self, other: Union[int, float], operation: str) -> None:
        if not isinstance(other, (int, float)):
            raise TypeError(
                f"unsupported operand type(s) for {operation}: '{type(self).__name__}' and '{type(other).__name__}'"
            )

    def __eq__(self, other: "Temperature") -> bool:
        if not isinstance(other, Temperature):
            return False
        return self.value == other.value

    def __add__(self, other: "Temperature") -> "Temperature":
        self._check_temperature_type(other, "+")
        return Temperature(self.value + other.value)

    def __sub__(self, other: "Temperature") -> "Temperature":
        self._check_temperature_type(other, "-")
        return Temperature(self.value - other.value)

    def __mul__(self, other: Union[int, float]) -> "Temperature":
        self._check_number_type(other, "*")
        return Temperature(self.value * Decimal(str(other)))

    def __truediv__(self, other: Union[int, float]) -> "Temperature":
        self._check_number_type(other, "/")
        return Temperature(self.value / Decimal(str(other)))

    def __floordiv__(self, other: Union[int, float]) -> "Temperature":
        self._check_number_type(other, "//")
        return Temperature(self.value // Decimal(str(other)))


class ProcedureStep:
    temperature: Temperature
    duration: int

    def __init__(self, temperature: Temperature, duration: int):
        self.temperature = temperature
        self.duration = duration

    def __iter__(self):
        yield ("temperature", self.temperature.float_celsius)
        yield ("duration", self.duration)


class Procedure:
    id: str
    name: str
    steps: list[ProcedureStep]

    def __init__(self, name: str, steps: list[ProcedureStep]):
        self.id = str(uuid.uuid4())
        self.name = name
        self.steps = steps

    def __iter__(self):
        yield ("id", self.id)
        yield ("name", self.name)
        yield ("steps", [dict(step) for step in self.steps])

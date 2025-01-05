from dataclasses import dataclass
from decimal import Decimal
import uuid
from enum import Enum


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

    def _check_number_type(self, other: int | float, operation: str) -> None:
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

    def __mul__(self, other: int | float) -> "Temperature":
        self._check_number_type(other, "*")
        return Temperature(self.value * Decimal(str(other)))

    def __truediv__(self, other: int | float) -> "Temperature":
        self._check_number_type(other, "/")
        return Temperature(self.value / Decimal(str(other)))

    def __floordiv__(self, other: int | float) -> "Temperature":
        self._check_number_type(other, "//")
        return Temperature(self.value // Decimal(str(other)))


class StepStatus(Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


class ProcedureStep:
    temperature: Temperature
    duration: int
    status: StepStatus
    elapsed_time: int

    def __init__(self, temperature: Temperature, duration: int):
        self.temperature = temperature
        self.duration = duration
        self.status = StepStatus.QUEUED
        self.elapsed_time = 0

    def __iter__(self):
        yield ("temperature", self.temperature.float_celsius)
        yield ("duration", self.duration)
        yield ("status", self.status.value)
        yield ("elapsed_time", self.elapsed_time)


class ProcedureStatus(Enum):
    IDLE = "idle"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


class Procedure:
    id: str
    name: str
    steps: list[ProcedureStep]
    status: ProcedureStatus
    _current_step: int

    def __init__(self, name: str, steps: list[ProcedureStep], id: str = None):
        self.id = id or str(uuid.uuid4())
        self.name = name
        self.steps = steps
        self.status = ProcedureStatus.IDLE
        self._current_step = -1

    @property
    def current_step(self) -> int:
        return self._current_step

    @current_step.setter
    def current_step(self, value: int) -> None:
        self._current_step = value

    def __iter__(self):
        yield ("id", self.id)
        yield ("name", self.name)
        yield ("steps", [dict(step) for step in self.steps])
        yield ("status", self.status.value)

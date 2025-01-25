import asyncio
from typing import TypedDict, TYPE_CHECKING

if TYPE_CHECKING:
    from services import ProcedureExecutionService

from model import (
    Procedure,
    ProcedureStep,
    Temperature,
    ProcedureStatus,
    StepStatus,
    RuntimeProcedureState,
)
from repository import IProcedureRepository
from serial_device import SerialDevice
from temperature_logger import TemperatureLogger


class ProcedureResponse(TypedDict):
    success: bool
    message: str
    procedure: dict[str, str | int | list[dict[str, float | int | str]]] | None


class ProcedureService:
    def __init__(
        self,
        repository: IProcedureRepository,
        execution_service: "ProcedureExecutionService | None" = None,
    ):
        self._repository = repository
        self._execution_service = execution_service
        self._initialize_default_procedures()

    def _initialize_default_procedures(self) -> None:
        if not self._repository.load_all():
            default_procedures = [
                Procedure(
                    name="Example Procedure 1",
                    steps=[
                        ProcedureStep(temperature=Temperature(50), duration=10),
                        ProcedureStep(temperature=Temperature(150), duration=20),
                        ProcedureStep(temperature=Temperature(225), duration=30),
                    ],
                ),
                Procedure(
                    name="Example Procedure 2",
                    steps=[
                        ProcedureStep(temperature=Temperature(40), duration=12),
                        ProcedureStep(temperature=Temperature(80), duration=18),
                    ],
                ),
            ]
            for procedure in default_procedures:
                self._repository.add(procedure)

    def _create_procedure_steps(
        self, steps: list[tuple[float, int]]
    ) -> list[ProcedureStep]:
        return [
            ProcedureStep(temperature=Temperature(temp), duration=duration)
            for temp, duration in steps
        ]

    def get_all(
        self,
    ) -> dict[str, list[dict[str, str | int | list[dict[str, float | int | str]]]]]:
        procedures = self._repository.load_all()
        if self._execution_service:
            active_procedure = self._execution_service.get_active_procedure()
            if active_procedure:
                # Update the active procedure with runtime state
                procedures = [
                    active_procedure.procedure
                    if p.id == active_procedure.procedure.id
                    else p
                    for p in procedures
                ]
        return {"procedures": [self._add_runtime_state(p) for p in procedures]}

    def _add_runtime_state(self, procedure: Procedure) -> dict:
        if (
            self._execution_service
            and self._execution_service.get_active_procedure()
            and self._execution_service.get_active_procedure().procedure.id
            == procedure.id
        ):
            return self._execution_service.get_active_procedure().to_dict()
        else:
            runtime_state = RuntimeProcedureState(procedure)
            return runtime_state.to_dict()

    def create(self, name: str, steps: list[tuple[float, int]]) -> ProcedureResponse:
        try:
            procedure_steps = self._create_procedure_steps(steps)
            new_procedure = Procedure(name, procedure_steps)
            self._repository.add(new_procedure)
            return {
                "success": True,
                "procedure": self._add_runtime_state(new_procedure),
                "message": "",
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error creating procedure: {str(e)}",
                "procedure": None,
            }

    def delete(self, procedure_id: str) -> ProcedureResponse:
        try:
            if self._repository.delete(procedure_id):
                return {
                    "success": True,
                    "message": f"Procedure {procedure_id} deleted successfully",
                    "procedure": None,
                }
            return {
                "success": False,
                "message": f"Procedure with ID {procedure_id} not found",
                "procedure": None,
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Error deleting procedure: {str(e)}",
                "procedure": None,
            }

    def update(
        self, procedure_id: str, name: str, steps: list[tuple[float, int]]
    ) -> ProcedureResponse:
        procedure_steps = self._create_procedure_steps(steps)
        updated_procedure = Procedure(name, procedure_steps, procedure_id)

        if self._repository.update(updated_procedure):
            return {
                "success": True,
                "procedure": self._add_runtime_state(updated_procedure),
                "message": "",
            }
        return {
            "success": False,
            "message": "Procedure not found",
            "procedure": None,
        }

    def reset_procedure(self, procedure_id: str) -> ProcedureResponse:
        procedures = self._repository.load_all()
        procedure = next((p for p in procedures if p.id == procedure_id), None)

        if not procedure:
            return {
                "success": False,
                "message": "Procedure not found",
                "procedure": None,
            }

        # Reset the active procedure in execution service if it exists
        if self._execution_service:
            self._execution_service.reset_active_procedure()

        return {
            "success": True,
            "procedure": self._add_runtime_state(procedure),
            "message": "Procedure reset successfully",
        }


class ProcedureExecutionService:
    def __init__(self, repository: IProcedureRepository, device: SerialDevice):
        self._repository = repository
        self._device = device
        self._active_procedure: RuntimeProcedureState | None = None
        self._task: asyncio.Task | None = None
        self._should_stop = False
        self._temperature_logger = TemperatureLogger()

    def get_active_procedure(self) -> RuntimeProcedureState | None:
        return self._active_procedure

    def reset_active_procedure(self) -> None:
        self._active_procedure = None
        self._task = None
        self._should_stop = False

    async def start_procedure(self, procedure_id: str) -> ProcedureResponse:
        if self._active_procedure:
            return {
                "success": False,
                "message": "Another procedure is already running",
                "procedure": None,
            }

        procedures = self._repository.load_all()
        procedure = next((p for p in procedures if p.id == procedure_id), None)

        if not procedure:
            return {
                "success": False,
                "message": "Procedure not found",
                "procedure": None,
            }

        self._active_procedure = RuntimeProcedureState(procedure)
        self._active_procedure.status = ProcedureStatus.RUNNING
        self._active_procedure.current_step = 0
        self._should_stop = False

        # Start a new temperature log file
        self._temperature_logger.start_new_log(procedure_id, procedure.name)

        self._task = asyncio.create_task(self._run_procedure())

        return {
            "success": True,
            "procedure": self._active_procedure.to_dict(),
            "message": "",
        }

    async def stop_procedure(self) -> ProcedureResponse:
        if not self._active_procedure:
            return {
                "success": False,
                "message": "No procedure is running",
                "procedure": None,
            }

        self._should_stop = True

        if self._task:
            try:
                await self._task
            except asyncio.CancelledError:
                pass

        # Reset device temperature to room temperature (25°C)
        await self._device.set_temperature(Temperature(25))

        # Mark current step as incomplete if it was running
        if self._active_procedure.current_step >= 0:
            current_state = self._active_procedure.step_states[
                self._active_procedure.current_step
            ]
            if current_state.status == StepStatus.RUNNING:
                current_state.status = StepStatus.QUEUED

        self._active_procedure.status = ProcedureStatus.STOPPED
        result = self._active_procedure.to_dict()
        self._active_procedure = None
        self._task = None
        return {"success": True, "procedure": result, "message": ""}

    async def _run_procedure(self) -> None:
        try:
            for i, (step, state) in enumerate(
                zip(
                    self._active_procedure.procedure.steps,
                    self._active_procedure.step_states,
                )
            ):
                if self._should_stop:
                    return

                self._active_procedure.current_step = i
                state.status = StepStatus.RUNNING
                state.elapsed_time = 0

                await self._device.set_temperature(step.temperature)

                for _ in range(step.duration):
                    if self._should_stop:
                        return

                    # Log temperature data
                    actual_temp = await self._device.read_temperature()
                    self._temperature_logger.log_temperature(
                        self._active_procedure.procedure.id,
                        step.temperature,
                        actual_temp,
                    )

                    await asyncio.sleep(1)
                    state.elapsed_time += 1

                state.status = StepStatus.COMPLETED

            if not self._should_stop:
                self._active_procedure.status = ProcedureStatus.COMPLETED
        except Exception as e:
            print(f"Error running procedure: {e}")
            if self._active_procedure:
                self._active_procedure.status = ProcedureStatus.FAILED
                if self._active_procedure.current_step >= 0:
                    current_state = self._active_procedure.step_states[
                        self._active_procedure.current_step
                    ]
                    current_state.status = StepStatus.FAILED
        finally:
            if self._task and self._task.done():
                self._task = None

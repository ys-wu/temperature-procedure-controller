import asyncio
from typing import TypedDict
from model import Procedure, ProcedureStep, Temperature, ProcedureStatus, StepStatus
from repository import IProcedureRepository
from serial_device import SerialDevice


class ProcedureResponse(TypedDict):
    success: bool
    message: str
    procedure: dict[str, str | int | list[dict[str, float | int | str]]] | None


class ProcedureService:
    def __init__(self, repository: IProcedureRepository):
        self._repository = repository
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
        return {"procedures": [dict(procedure) for procedure in procedures]}

    def create(self, name: str, steps: list[tuple[float, int]]) -> ProcedureResponse:
        try:
            procedure_steps = self._create_procedure_steps(steps)
            new_procedure = Procedure(name, procedure_steps)
            self._repository.add(new_procedure)
            return {"success": True, "procedure": dict(new_procedure), "message": ""}
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
                "procedure": dict(updated_procedure),
                "message": "",
            }
        return {
            "success": False,
            "message": "Procedure not found",
            "procedure": None,
        }


class ProcedureExecutionService:
    def __init__(self, repository: IProcedureRepository, device: SerialDevice):
        self._repository = repository
        self._device = device
        self._active_procedure: Procedure | None = None
        self._task: asyncio.Task | None = None
        self._should_stop = False

    def get_active_procedure(
        self,
    ) -> dict[str, str | int | list[dict[str, float | int | str]]] | None:
        if self._active_procedure:
            return dict(self._active_procedure)
        return None

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

        self._active_procedure = procedure
        self._active_procedure.status = ProcedureStatus.RUNNING
        self._active_procedure.current_step = 0
        self._should_stop = False
        self._task = asyncio.create_task(self._run_procedure())

        return {"success": True, "procedure": dict(procedure), "message": ""}

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
            current_step = self._active_procedure.steps[
                self._active_procedure.current_step
            ]
            if current_step.status == StepStatus.RUNNING:
                current_step.status = StepStatus.QUEUED

        self._active_procedure.status = ProcedureStatus.STOPPED
        result = dict(self._active_procedure)
        self._active_procedure = None
        self._task = None
        return {"success": True, "procedure": result, "message": ""}

    async def _run_procedure(self) -> None:
        try:
            for i, step in enumerate(self._active_procedure.steps):
                if self._should_stop:
                    return

                self._active_procedure.current_step = i
                step.status = StepStatus.RUNNING
                step.elapsed_time = 0

                await self._device.set_temperature(step.temperature)

                for _ in range(step.duration):
                    if self._should_stop:
                        return

                    await asyncio.sleep(1)
                    step.elapsed_time += 1

                step.status = StepStatus.COMPLETED

            if not self._should_stop:
                self._active_procedure.status = ProcedureStatus.COMPLETED
        except Exception as e:
            print(f"Error running procedure: {e}")
            if self._active_procedure:
                self._active_procedure.status = ProcedureStatus.FAILED
                if self._active_procedure.current_step >= 0:
                    current_step = self._active_procedure.steps[
                        self._active_procedure.current_step
                    ]
                    current_step.status = StepStatus.FAILED
        finally:
            if self._task and self._task.done():
                self._task = None

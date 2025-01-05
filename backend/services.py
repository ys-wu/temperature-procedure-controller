from typing import Any
from model import Procedure, ProcedureStep, Temperature
from repository import IProcedureRepository


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
                        ProcedureStep(temperature=Temperature(30), duration=300),
                        ProcedureStep(temperature=Temperature(50), duration=600),
                        ProcedureStep(temperature=Temperature(25), duration=300),
                    ],
                ),
                Procedure(
                    name="Example Procedure 2",
                    steps=[
                        ProcedureStep(temperature=Temperature(40), duration=120),
                        ProcedureStep(temperature=Temperature(45), duration=180),
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

    def get_all(self) -> dict[str, list[dict[str, Any]]]:
        procedures = self._repository.load_all()
        return {"procedures": [dict(procedure) for procedure in procedures]}

    def create(self, name: str, steps: list[tuple[float, int]]) -> dict[str, Any]:
        try:
            procedure_steps = self._create_procedure_steps(steps)
            new_procedure = Procedure(name, procedure_steps)
            self._repository.add(new_procedure)
            return dict(new_procedure)
        except Exception as e:
            return {"success": False, "message": f"Error creating procedure: {str(e)}"}

    def delete(self, procedure_id: str) -> dict[str, Any]:
        try:
            if self._repository.delete(procedure_id):
                return {
                    "success": True,
                    "message": f"Procedure {procedure_id} deleted successfully",
                }
            return {
                "success": False,
                "message": f"Procedure with ID {procedure_id} not found",
            }
        except Exception as e:
            return {"success": False, "message": f"Error deleting procedure: {str(e)}"}

    def update(
        self, procedure_id: str, name: str, steps: list[tuple[float, int]]
    ) -> dict[str, Any]:
        procedure_steps = self._create_procedure_steps(steps)
        updated_procedure = Procedure(name, procedure_steps, procedure_id)

        if self._repository.update(updated_procedure):
            return dict(updated_procedure)
        return {"success": False, "message": "Procedure not found"}

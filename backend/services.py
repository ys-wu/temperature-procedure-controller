from typing import Any
from model import Procedure, ProcedureStep, Temperature


class ProcedureService:
    def __init__(self):
        self._procedures = [
            Procedure(
                name="Basic Heat Up",
                steps=[
                    ProcedureStep(temperature=Temperature(30), duration=300),
                    ProcedureStep(temperature=Temperature(50), duration=600),
                    ProcedureStep(temperature=Temperature(25), duration=300),
                ],
            ),
            Procedure(
                name="Quick Test",
                steps=[
                    ProcedureStep(temperature=Temperature(40), duration=120),
                    ProcedureStep(temperature=Temperature(45), duration=180),
                ],
            ),
        ]

    def _create_procedure_steps(
        self, steps: list[tuple[float, int]]
    ) -> list[ProcedureStep]:
        return [
            ProcedureStep(temperature=Temperature(temp), duration=duration)
            for temp, duration in steps
        ]

    def get_all(self) -> dict[str, list[dict[str, Any]]]:
        return {"procedures": [dict(procedure) for procedure in self._procedures]}

    def create(self, name: str, steps: list[tuple[float, int]]) -> dict[str, Any]:
        try:
            procedure_steps = self._create_procedure_steps(steps)
            new_procedure = Procedure(name, procedure_steps)
            self._procedures.append(new_procedure)
            return dict(new_procedure)
        except Exception as e:
            return {"success": False, "message": f"Error creating procedure: {str(e)}"}

    def delete(self, procedure_id: str) -> dict[str, Any]:
        try:
            procedure_to_delete = None
            for proc in self._procedures:
                if str(proc.id) == procedure_id:
                    procedure_to_delete = proc
                    break

            if not procedure_to_delete:
                return {
                    "success": False,
                    "message": f"Procedure with ID {procedure_id} not found",
                }

            self._procedures.remove(procedure_to_delete)
            return {
                "success": True,
                "message": f"Procedure {procedure_id} deleted successfully",
            }
        except Exception as e:
            return {"success": False, "message": f"Error deleting procedure: {str(e)}"}

    def update(
        self, procedure_id: str, name: str, steps: list[tuple[float, int]]
    ) -> dict[str, Any]:
        for i, procedure in enumerate(self._procedures):
            if str(procedure.id) == procedure_id:
                procedure_steps = self._create_procedure_steps(steps)
                updated_procedure = Procedure(name, procedure_steps, procedure_id)
                self._procedures[i] = updated_procedure
                return dict(updated_procedure)

        return {"success": False, "message": "Procedure not found"}

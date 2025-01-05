import uuid
from typing import Any
from model import Procedure, ProcedureStep, Temperature


class ProcedureService:
    def __init__(self):
        self.procedures = [
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
        self._procedures = [dict(procedure) for procedure in self.procedures]

    def get_all(self) -> dict[str, list[dict[str, Any]]]:
        return {"procedures": self._procedures}

    def create(self, name: str, steps: list[tuple[float, int]]) -> dict[str, Any]:
        new_procedure = {
            "id": str(uuid.uuid4()),
            "name": name,
            "steps": [
                {"temperature": temp, "duration": duration} for temp, duration in steps
            ],
        }
        self._procedures.append(new_procedure)
        return new_procedure

    def delete(self, procedure_id: str) -> dict[str, Any]:
        try:
            # First find the procedure to ensure it exists
            procedure_to_delete = None
            for proc in self._procedures:
                if str(proc["id"]) == procedure_id:
                    procedure_to_delete = proc
                    break

            if not procedure_to_delete:
                return {
                    "success": False,
                    "message": f"Procedure with ID {procedure_id} not found",
                }

            # Remove the procedure
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
            if str(procedure["id"]) == procedure_id:
                updated_procedure = {
                    "id": procedure_id,
                    "name": name,
                    "steps": [
                        {"temperature": temp, "duration": duration}
                        for temp, duration in steps
                    ],
                }
                self._procedures[i] = updated_procedure
                return updated_procedure

        return {"success": False, "message": "Procedure not found"}

import json
import os
from abc import ABC, abstractmethod
from typing import List
from model import Procedure, ProcedureStep, Temperature


class IProcedureRepository(ABC):
    @abstractmethod
    def save_all(self, procedures: List[Procedure]) -> None:
        pass

    @abstractmethod
    def load_all(self) -> List[Procedure]:
        pass

    @abstractmethod
    def add(self, procedure: Procedure) -> None:
        pass

    @abstractmethod
    def delete(self, procedure_id: str) -> bool:
        pass

    @abstractmethod
    def update(self, procedure: Procedure) -> bool:
        pass


class JsonProcedureRepository(IProcedureRepository):
    def __init__(self, file_path: str = "data/procedures.json"):
        self.file_path = file_path
        self._ensure_data_directory()

    def _ensure_data_directory(self) -> None:
        os.makedirs(os.path.dirname(self.file_path), exist_ok=True)

    def _save_procedures(self, procedures: List[dict]) -> None:
        with open(self.file_path, "w") as f:
            json.dump(procedures, f, indent=2)

    def _load_procedures(self) -> List[dict]:
        if not os.path.exists(self.file_path):
            return []
        try:
            with open(self.file_path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []

    def _dict_to_procedure(self, proc_dict: dict) -> Procedure:
        steps = [
            ProcedureStep(
                temperature=Temperature(step["temperature"]), duration=step["duration"]
            )
            for step in proc_dict["steps"]
        ]
        return Procedure(name=proc_dict["name"], steps=steps, id=proc_dict["id"])

    def save_all(self, procedures: List[Procedure]) -> None:
        procedures_dict = [dict(proc) for proc in procedures]
        self._save_procedures(procedures_dict)

    def load_all(self) -> List[Procedure]:
        procedures_dict = self._load_procedures()
        return [self._dict_to_procedure(proc) for proc in procedures_dict]

    def add(self, procedure: Procedure) -> None:
        procedures = self._load_procedures()
        procedures.append(dict(procedure))
        self._save_procedures(procedures)

    def delete(self, procedure_id: str) -> bool:
        procedures = self._load_procedures()
        initial_length = len(procedures)
        procedures = [p for p in procedures if p["id"] != procedure_id]
        if len(procedures) < initial_length:
            self._save_procedures(procedures)
            return True
        return False

    def update(self, procedure: Procedure) -> bool:
        procedures = self._load_procedures()
        for i, proc in enumerate(procedures):
            if proc["id"] == procedure.id:
                procedures[i] = dict(procedure)
                self._save_procedures(procedures)
                return True
        return False

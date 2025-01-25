import asyncio
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from repository import JsonProcedureRepository
from serial_device import RealSerialDevice, Temperature
from services import ProcedureService, ProcedureExecutionService

device = RealSerialDevice()
procedure_repository = JsonProcedureRepository()
procedure_execution_service = ProcedureExecutionService(procedure_repository, device)
procedure_service = ProcedureService(procedure_repository, procedure_execution_service)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class PortRequest(BaseModel):
    port: str


class TemperatureRequest(BaseModel):
    temperature: float


class ProcedureStepRequest(BaseModel):
    temperature: float
    duration: int


class CreateProcedureRequest(BaseModel):
    name: str
    steps: list[ProcedureStepRequest]


@app.get("/")
def read_root():
    return {"message": "Temperature Procedure Controller API"}


@app.get("/serial-ports")
def get_serial_ports():
    return {"ports": ["COM1", "COM2", "COM3"]}


@app.post("/select-serial-port")
def set_serial_port(request: PortRequest):
    return {"message": f"Serial port set to {request.port}"}


@app.post("/set-temperature")
async def set_temperature(request: TemperatureRequest):
    await device.set_temperature(Temperature(request.temperature))
    return {"temperature": request.temperature}


@app.post("/procedures")
def create_procedure(request: CreateProcedureRequest):
    steps = [(step.temperature, step.duration) for step in request.steps]
    return procedure_service.create(request.name, steps)


@app.get("/procedures")
def get_procedures():
    return procedure_service.get_all()


@app.delete("/procedures/{procedure_id}")
def delete_procedure(procedure_id: str):
    result = procedure_service.delete(procedure_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.put("/procedures/{procedure_id}")
def update_procedure(procedure_id: str, request: CreateProcedureRequest):
    steps = [(step.temperature, step.duration) for step in request.steps]
    return procedure_service.update(procedure_id, request.name, steps)


@app.post("/procedures/{procedure_id}/start")
async def start_procedure(procedure_id: str):
    return await procedure_execution_service.start_procedure(procedure_id)


@app.post("/procedures/{procedure_id}/reset")
def reset_procedure(procedure_id: str):
    result = procedure_service.reset_procedure(procedure_id)
    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])
    return result


@app.post("/procedures/stop")
async def stop_procedure():
    return await procedure_execution_service.stop_procedure()


@app.get("/procedures/active")
def get_active_procedure():
    return procedure_execution_service.get_active_procedure()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
        except Exception as e:
            print(f"Error accepting WebSocket connection: {e}")
            raise

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def send_message(self, websocket: WebSocket):
        try:
            while True:
                if websocket.client_state.value == 3:  # WebSocket.DISCONNECTED
                    break

                status_data = device.status
                active_procedure = procedure_execution_service.get_active_procedure()
                if active_procedure:
                    status_data["active_procedure"] = active_procedure.to_dict()

                await websocket.send_json(status_data)
                await asyncio.sleep(1)
        except WebSocketDisconnect:
            print("Client disconnected normally")
            raise
        except Exception as e:
            print(f"Error sending message: {e}")
            raise
        finally:
            self.disconnect(websocket)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
        await manager.send_message(websocket)
    except WebSocketDisconnect:
        print("WebSocket disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)

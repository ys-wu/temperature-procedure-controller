import asyncio
from pydantic import BaseModel
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from serial_device import MockSerialDevice, Temperature


device = MockSerialDevice(25, 25)


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


class ProcedureStep(BaseModel):
    temperature: float
    duration: int


class CreateProcedureRequest(BaseModel):
    name: str
    steps: list[ProcedureStep]


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
    new_procedure = {
        "id": len(temperature_procedures) + 1,
        "name": request.name,
        "steps": [
            {"temperature": step.temperature, "duration": step.duration}
            for step in request.steps
        ],
    }
    temperature_procedures.append(new_procedure)
    return new_procedure


# Sample temperature procedures
temperature_procedures = [
    {
        "id": 1,
        "name": "Basic Heat Up",
        "steps": [
            {"temperature": 30, "duration": 300},
            {"temperature": 50, "duration": 600},
            {"temperature": 25, "duration": 300},
        ],
    },
    {
        "id": 2,
        "name": "Quick Test",
        "steps": [
            {"temperature": 40, "duration": 120},
            {"temperature": 45, "duration": 180},
        ],
    },
]


@app.get("/procedures")
def get_procedures():
    return {"procedures": temperature_procedures}


@app.post("/procedures/delete/{procedure_id}")
def delete_procedure(procedure_id: int):
    global temperature_procedures
    original_length = len(temperature_procedures)
    temperature_procedures = [
        p for p in temperature_procedures if p["id"] != procedure_id
    ]

    if len(temperature_procedures) == original_length:
        return {"success": False, "message": "Procedure not found"}

    return {"success": True, "message": "Procedure deleted"}


@app.put("/procedures/{procedure_id}")
def update_procedure(procedure_id: int, request: CreateProcedureRequest):
    global temperature_procedures
    for i, procedure in enumerate(temperature_procedures):
        if procedure["id"] == procedure_id:
            updated_procedure = {
                "id": procedure_id,
                "name": request.name,
                "steps": [
                    {"temperature": step.temperature, "duration": step.duration}
                    for step in request.steps
                ],
            }
            temperature_procedures[i] = updated_procedure
            return updated_procedure

    return {"success": False, "message": "Procedure not found"}


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
                await websocket.send_json(device.status)
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

import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware


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
def set_temperature(request: TemperatureRequest):
    global message
    message["temperature_setpoint"] = request.temperature
    return {"temperature": request.temperature}


message = {
    "temperature_setpoint": 25,
    "temperature_actual": 25,
    "temperature_status": "OK",
}


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
                global message
                message["temperature_actual"] += (
                    message["temperature_setpoint"] - message["temperature_actual"]
                ) / 10
                await websocket.send_json(message)
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

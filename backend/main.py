from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Temperature Procedure Controller API"}


@app.get("/serial-ports")
def get_serial_ports():
    return {"ports": ["COM1", "COM2", "COM3"]}

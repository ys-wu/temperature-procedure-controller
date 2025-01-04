export const HOST = "localhost:8000";

export const HTTP_BASE_URL = `http://${HOST}`;
export const SERIAL_PORTS_URL = `${HTTP_BASE_URL}/serial-ports`;
export const SELECT_SERIAL_PORT_URL = `${HTTP_BASE_URL}/select-serial-port`;
export const SET_TEMPERATURE_URL = `${HTTP_BASE_URL}/set-temperature`;

export const WS_BASE_URL = `ws://${HOST}`;
export const WS_URL = `${WS_BASE_URL}/ws`;

export const HTTP_BASE_URL = 'http://localhost:8000';
export const WS_BASE_URL = 'ws://localhost:8000';

// Base URLs for different features
export const PROCEDURE_BASE_URL = `${HTTP_BASE_URL}/procedures`;
export const SERIAL_PORT_BASE_URL = `${HTTP_BASE_URL}/serial-port`;

// API Endpoints
export const API_URLS = {
  procedures: {
    list: PROCEDURE_BASE_URL,
    create: PROCEDURE_BASE_URL,
    update: (id: string) => `${PROCEDURE_BASE_URL}/${id}`,
    delete: (id: string) => `${PROCEDURE_BASE_URL}/${id}`,
    start: (id: string) => `${PROCEDURE_BASE_URL}/${id}/start`,
    stop: `${PROCEDURE_BASE_URL}/stop`,
    active: `${PROCEDURE_BASE_URL}/active`,
  },
  serialPort: {
    list: `${SERIAL_PORT_BASE_URL}s`,
    select: `${SERIAL_PORT_BASE_URL}/select`,
    setTemperature: `${HTTP_BASE_URL}/set-temperature`,
  },
  ws: {
    status: `${WS_BASE_URL}/ws`,
  },
} as const;

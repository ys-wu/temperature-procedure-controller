# Temperature Procedure Controller

## System Architecture

The application consists of two main components:
- Backend: Python FastAPI service
- Frontend: React/TypeScript web interface

## Prerequisites

Before starting, ensure you have installed:
- [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) added to PATH
- Latest version of [yarn](https://yarnpkg.com/) package manager
- [Python](https://www.python.org/downloads/) runtime added to PATH
- [Git Bash](https://gitforwindows.org/) terminal application

## Starting the Application

### Backend Service

1. Open a new Git Bash terminal
2. Navigate to the project directory:
   ```bash
   cd temperature-procedure-controller
   cd backend
   ```
3. Activate the Python virtual environment:
   ```bash
   . venv/Scripts/activate
   ```
4. Start the backend server:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
5. Keep this terminal running

### Frontend Application

1. Open another Git Bash terminal
2. Navigate to the project directory:
   ```bash
   cd temperature-procedure-controller
   cd frontend
   ```
3. Start the frontend development server:
   ```bash
   yarn start
   ```
4. Keep this terminal running

## Using the Application

> **!!! IMPORTANT**: Ensure only one browser window with a single tab is running the application!

Access the application in your browser at:
```
http://localhost:3000/
```

## Accessing Recorded Data

Temperature logs are stored at:
```
~/temperature-procedure-controller/backend/data/temperature_logs
```

## Shutting Down

To stop both services, press `Ctrl + C` in each of the Git Bash terminals.

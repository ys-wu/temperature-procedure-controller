import os
import csv
import logging
from datetime import datetime
from typing import TypedDict
from model import Temperature


# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)


class TemperatureRecord(TypedDict):
    timestamp: str
    setpoint: float
    actual: float


class TemperatureLogger:
    def __init__(self, data_dir: str = "data/temperature_logs"):
        # Get absolute paths for debugging
        current_file = os.path.abspath(__file__)
        logger.debug(f"Current file: {current_file}")

        # Backend directory is one level up from this file
        backend_dir = os.path.dirname(current_file)
        logger.debug(f"Backend directory: {backend_dir}")

        # Data directory will be under backend
        self.data_dir = os.path.join(backend_dir, data_dir)
        logger.info(
            f"Temperature logger initialized with data directory: {self.data_dir}"
        )

        # Print current working directory for debugging
        cwd = os.getcwd()
        logger.debug(f"Current working directory: {cwd}")

        self._ensure_data_directory()
        self._current_log_file: str | None = None

    def _ensure_data_directory(self) -> None:
        """Create the data directory if it doesn't exist"""
        try:
            # Create all parent directories if they don't exist
            os.makedirs(self.data_dir, exist_ok=True)
            logger.info(f"Ensured data directory exists: {self.data_dir}")

            # List contents of the directory
            if os.path.exists(self.data_dir):
                contents = os.listdir(self.data_dir)
                logger.debug(f"Directory contents: {contents}")
            else:
                logger.error(f"Failed to create directory: {self.data_dir}")
                raise RuntimeError(f"Failed to create directory: {self.data_dir}")
        except Exception as e:
            logger.error(f"Error creating directory {self.data_dir}: {e}")
            raise

    def _sanitize_filename(self, name: str) -> str:
        """Convert procedure name to a safe filename"""
        # Replace spaces and special characters with underscores
        return "".join(c if c.isalnum() else "_" for c in name)

    def start_new_log(self, procedure_id: str, procedure_name: str) -> None:
        """Start a new log file for a procedure run"""
        # Ensure directory exists before creating file
        self._ensure_data_directory()

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_name = self._sanitize_filename(procedure_name)
        filename = f"{timestamp}_{safe_name}.csv"
        self._current_log_file = os.path.join(self.data_dir, filename)
        logger.info(f"Starting new temperature log file: {self._current_log_file}")

        # Create new file with headers
        try:
            with open(self._current_log_file, "w", newline="") as f:
                writer = csv.DictWriter(
                    f, fieldnames=["timestamp", "setpoint", "actual"]
                )
                writer.writeheader()
            logger.info("Successfully created new log file with headers")
            # Verify file was created
            if os.path.exists(self._current_log_file):
                logger.debug(f"Verified file exists: {self._current_log_file}")
            else:
                logger.error(f"File was not created: {self._current_log_file}")
        except Exception as e:
            logger.error(f"Error creating log file: {e}")
            raise

    def log_temperature(
        self, procedure_id: str, setpoint: Temperature, actual: Temperature
    ) -> None:
        """Log temperature data for a specific procedure"""
        if not self._current_log_file:
            error_msg = "No active log file. Call start_new_log() first."
            logging.error(error_msg)
            raise RuntimeError(error_msg)

        record: TemperatureRecord = {
            "timestamp": datetime.now().isoformat(),
            "setpoint": setpoint.float_celsius,
            "actual": actual.float_celsius,
        }

        try:
            with open(self._current_log_file, "a", newline="") as f:
                writer = csv.DictWriter(
                    f, fieldnames=["timestamp", "setpoint", "actual"]
                )
                writer.writerow(record)
        except Exception as e:
            logging.error(f"Error logging temperature data: {e}")
            raise

    def get_temperature_log(self, filepath: str) -> list[TemperatureRecord]:
        """Retrieve temperature log from a specific file"""
        if not os.path.exists(filepath):
            return []

        try:
            records: list[TemperatureRecord] = []
            with open(filepath, "r", newline="") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    records.append(
                        {
                            "timestamp": row["timestamp"],
                            "setpoint": float(row["setpoint"]),
                            "actual": float(row["actual"]),
                        }
                    )
            return records
        except Exception as e:
            print(f"Error reading temperature log: {e}")
            return []

    def get_current_log_file(self) -> str | None:
        """Get the path of the current log file"""
        return self._current_log_file

import logging
import time

from fastapi import FastAPI
from fastapi.responses import JSONResponse


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)

logger = logging.getLogger(__name__)

app = FastAPI(
    title="Beanstalk Incident Copilot - Victim App",
    version="0.1.0",
)


@app.get("/")
def home():
    return {
        "service": "victim-app",
        "status": "healthy",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
    }


@app.get("/failure/db")
def database_failure():
    logger.error("ERROR database connection refused")
    logger.error("ERROR failed to connect to database")

    time.sleep(2)

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Database connection failed",
        },
    )

@app.get("/failure/500")
def server_failure():
    logger.error("ERROR unexpected application exception")
    logger.error("ERROR payment service returned invalid response")

    return JSONResponse(
        status_code=500,
        content={
            "status": "error",
            "message": "Internal application error",
        },
    )

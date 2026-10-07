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

@app.get("/failure/latency")
def latency_failure():
    logger.warning("WARNING downstream payment service is slow")
    logger.warning("WARNING request latency is increasing")

    time.sleep(8)

    return {
        "status": "degraded",
        "message": "Request completed with high latency",
    }

@app.get("/failure/cpu")
def cpu_failure():
    logger.warning("WARNING CPU pressure simulation started")

    end_time = time.time() + 5
    while time.time() < end_time:
        _ = sum(i * i for i in range(10000))

    logger.warning("WARNING CPU pressure simulation completed")

    return {
        "status": "degraded",
        "message": "CPU pressure simulation completed",
    }

@app.get("/failure/memory")
def memory_failure():
    logger.warning("WARNING memory pressure simulation started")

    chunks = []
    for _ in range(25):
        chunks.append(bytearray(1024 * 1024))

    logger.warning("WARNING memory pressure simulation completed")

    return {
        "status": "degraded",
        "message": "Memory pressure simulation completed",
        "allocated_mb": len(chunks),
    }

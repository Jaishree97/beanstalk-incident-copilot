import os
from pathlib import Path

import boto3
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from app.services.bedrock import analyze_incident
from app.routes.environments import router as environments_router


REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("INCIDENT_TABLE_NAME", "beanstalk-incidents")
BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST = BASE_DIR / "frontend" / "dist"

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


app = FastAPI(
    title="Beanstalk Incident Copilot",
    version="0.2.0",
)

app.include_router(environments_router)


class IncidentRequest(BaseModel):
    evidence: dict


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "service": "beanstalk-incident-copilot",
    }


@app.post("/api/incidents/analyze")
def analyze(request: IncidentRequest):
    return analyze_incident(request.evidence)


@app.get("/api/incidents")
def list_incidents():
    response = table.scan()
    incidents = response.get("Items", [])

    incidents.sort(
        key=lambda incident: incident.get("created_at", ""),
        reverse=True,
    )

    return {
        "count": len(incidents),
        "incidents": incidents,
    }




@app.get("/api/incidents/{incident_id}")
def get_incident(incident_id: str):
    response = table.get_item(
        Key={"incident_id": incident_id}
    )

    incident = response.get("Item")

    if not incident:
        raise HTTPException(
            status_code=404,
            detail="Incident not found",
        )

    return incident

if FRONTEND_DIST.exists():
    app.mount(
        "/assets",
        StaticFiles(directory=FRONTEND_DIST / "assets"),
        name="assets",
    )

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        requested = FRONTEND_DIST / full_path

        if full_path and requested.is_file():
            return FileResponse(requested)

        return FileResponse(FRONTEND_DIST / "index.html")

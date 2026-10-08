import os

import boto3
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from copilot.app.services.bedrock import analyze_incident


REGION = os.environ.get("AWS_REGION", "us-east-1")
TABLE_NAME = os.environ.get("INCIDENT_TABLE_NAME", "beanstalk-incidents")

dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


app = FastAPI(
    title="Beanstalk Incident Copilot",
    version="0.2.0",
)


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
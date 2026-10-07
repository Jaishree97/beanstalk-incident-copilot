from fastapi import FastAPI
from pydantic import BaseModel

from copilot.app.services.bedrock import analyze_incident


app = FastAPI(
    title="Beanstalk Incident Copilot",
    version="0.1.0",
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
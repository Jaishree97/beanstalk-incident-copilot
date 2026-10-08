import json
import logging
import os
from datetime import datetime, timedelta, timezone

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0")

cloudwatch = boto3.client("cloudwatch", region_name=REGION)
logs = boto3.client("logs", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)


def get_recent_logs():
    log_group = (
        "/aws/elasticbeanstalk/"
        "victim-app-prod/var/log/web.stdout.log"
    )

    start_time = int(
        (datetime.now(timezone.utc) - timedelta(minutes=5)).timestamp() * 1000
    )

    response = logs.filter_log_events(
        logGroupName=log_group,
        startTime=start_time,
        limit=100,
    )

    return [
        event["message"]
        for event in response.get("events", [])
    ]


def analyze_with_bedrock(evidence):
    prompt = f"""
You are an incident-response copilot for an AWS Elastic Beanstalk application.

Analyze the incident evidence below.

Return ONLY valid JSON with exactly these fields:

{{
  "severity": "critical|high|medium|low",
  "root_cause": "string",
  "confidence": 0,
  "summary": "string",
  "evidence": ["string"],
  "recommended_actions": ["string"],
  "prevention": ["string"]
}}

Rules:
- confidence must be an integer from 0 to 100.
- Use only evidence provided below.
- Do not invent facts.
- If evidence is insufficient, say so.
- Keep evidence and recommendations concise.

Incident evidence:
{json.dumps(evidence, default=str)}
"""

    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": prompt}
                ],
            }
        ],
        inferenceConfig={
            "maxTokens": 1000,
            "temperature": 0,
        },
    )

    text = response["output"]["message"]["content"][0]["text"].strip()

    if text.startswith("```json"):
        text = text[7:]

    if text.endswith("```"):
        text = text[:-3]

    return json.loads(text.strip())


def lambda_handler(event, context):
    logger.info("Incident investigation started")

    detail = event.get("detail", {})
    alarm_name = detail.get("alarmName", "unknown")
    state = detail.get("state", {})

    logs_data = get_recent_logs()

    evidence = {
        "alarm_name": alarm_name,
        "alarm_state": state,
        "environment": "victim-app-prod",
        "region": REGION,
        "recent_logs": logs_data,
    }

    logger.info(
        "Collected evidence: %s",
        json.dumps(evidence, default=str),
    )

    diagnosis = analyze_with_bedrock(evidence)

    logger.info(
        "INCIDENT_DIAGNOSIS=%s",
        json.dumps(diagnosis),
    )

    return {
        "statusCode": 200,
        "diagnosis": diagnosis,
    }
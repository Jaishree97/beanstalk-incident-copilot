import json
import logging
import os
from datetime import datetime, timedelta, timezone

import boto3
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

REGION = os.environ.get("AWS_REGION", "us-east-1")
MODEL_ID = os.environ.get("BEDROCK_MODEL_ID", "us.amazon.nova-pro-v1:0")
TABLE_NAME = os.environ.get("INCIDENT_TABLE_NAME", "beanstalk-incidents")

logs = boto3.client("logs", region_name=REGION)
bedrock = boto3.client("bedrock-runtime", region_name=REGION)
dynamodb = boto3.resource("dynamodb", region_name=REGION)
table = dynamodb.Table(TABLE_NAME)


def get_environment_from_alarm(alarm_name):
    """
    Map the CloudWatch alarm to the Elastic Beanstalk environment.

    Current alarms:
      victim-app-5xx         -> victim-app-prod
      victim-app-staging-5xx -> victim-app-staging
    """

    alarm_environment_map = {
        "victim-app-5xx": "victim-app-prod",
        "victim-app-staging-5xx": "victim-app-staging",
    }

    environment = alarm_environment_map.get(alarm_name)

    if environment:
        return environment

    logger.warning(
        "Unknown alarm name '%s'. Falling back to victim-app-prod.",
        alarm_name,
    )

    return "victim-app-prod"


def get_recent_logs(environment):
    log_group = (
        f"/aws/elasticbeanstalk/"
        f"{environment}/var/log/web.stdout.log"
    )

    start_time = int(
        (datetime.now(timezone.utc) - timedelta(minutes=5)).timestamp() * 1000
    )

    logger.info(
        "Collecting logs from environment=%s log_group=%s",
        environment,
        log_group,
    )

    response = logs.filter_log_events(
        logGroupName=log_group,
        startTime=start_time,
        limit=100,
    )

    return [event["message"] for event in response.get("events", [])]


def analyze_with_bedrock(evidence):
    prompt = f"""
You are an incident-response copilot for an AWS Elastic Beanstalk application.

Analyze the incident evidence below.

Return ONLY valid JSON with exactly:

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
- confidence must be an integer from 0 to 100
- use only the evidence provided
- do not invent facts
- if evidence is insufficient, say so
- keep the response concise

Incident evidence:
{json.dumps(evidence, default=str)}
"""

    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": prompt}],
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


def save_incident(event, evidence, diagnosis):
    incident_id = event.get("id")

    if not incident_id:
        incident_id = (
            f"{evidence['alarm_name']}-"
            f"{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}"
        )

    item = {
        "incident_id": incident_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "environment": evidence["environment"],
        "region": evidence["region"],
        "alarm_name": evidence["alarm_name"],
        "severity": diagnosis.get("severity", "unknown"),
        "root_cause": diagnosis.get("root_cause", ""),
        "confidence": diagnosis.get("confidence", 0),
        "summary": diagnosis.get("summary", ""),
        "evidence": diagnosis.get("evidence", []),
        "recommended_actions": diagnosis.get("recommended_actions", []),
        "prevention": diagnosis.get("prevention", []),
    }

    try:
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(incident_id)",
        )

        logger.info(
            "INCIDENT_SAVED=%s",
            json.dumps(item, default=str),
        )

    except ClientError as exc:
        error_code = exc.response.get("Error", {}).get("Code")

        if error_code == "ConditionalCheckFailedException":
            logger.info(
                "Incident already exists, skipping duplicate: %s",
                incident_id,
            )
        else:
            raise


def lambda_handler(event, context):
    logger.info("Incident investigation started")

    detail = event.get("detail", {})

    alarm_name = detail.get("alarmName", "unknown")
    state = detail.get("state", {})

    environment = get_environment_from_alarm(alarm_name)

    logs_data = get_recent_logs(environment)

    evidence = {
        "alarm_name": alarm_name,
        "alarm_state": state,
        "environment": environment,
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

    save_incident(
        event=event,
        evidence=evidence,
        diagnosis=diagnosis,
    )

    return {
        "statusCode": 200,
        "incident_id": event.get("id"),
        "environment": environment,
        "diagnosis": diagnosis,
    }
import json
import os

import boto3


MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

bedrock = boto3.client(
    "bedrock-runtime",
    region_name=AWS_REGION,
)


def analyze_incident(evidence: dict) -> dict:
    prompt = f"""
You are an AWS production incident investigation assistant.

Analyze the following incident evidence and return ONLY valid JSON.

Incident evidence:
{json.dumps(evidence, indent=2)}

Return exactly this structure:

{{
  "severity": "critical|high|medium|low",
  "root_cause": "concise likely root cause",
  "confidence": 0,
  "summary": "short explanation",
  "evidence": [
    "Every item in this array MUST be a string describing one piece of evidence."
  ],
  "recommended_actions": [
    "specific remediation action"
  ],
  "prevention": [
    "specific prevention recommendation"
  ]
}}

Rules:
- confidence must be an integer from 0 to 100.
- Base the diagnosis only on the supplied evidence.
- Do not invent logs, metrics, deployments, or AWS events.
- If evidence is insufficient, say so explicitly.
- The "evidence", "recommended_actions", and "prevention" arrays MUST contain strings only.
- Do not put JSON objects or key-value pairs inside those arrays.
- Return syntactically valid JSON.
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
            "maxTokens": 1200,
            "temperature": 0,
        },
    )

    text = response["output"]["message"]["content"][0]["text"]

    text = text.strip()

    if text.startswith("```json"):
        text = text[7:]

    if text.endswith("```"):
        text = text[:-3]

    text = text.strip()


    return json.loads(text)
import os

import boto3
from fastapi import APIRouter

router = APIRouter(prefix="/api/environments", tags=["environments"])

REGION = os.environ.get("AWS_REGION", "us-east-1")

eb = boto3.client("elasticbeanstalk", region_name=REGION)
cloudwatch = boto3.client("cloudwatch", region_name=REGION)

ENVIRONMENTS = [
    {
        "key": "production",
        "name": "Production",
        "environment_name": "victim-app-prod",
        "alarm_name": "victim-app-5xx",
    },
    {
        "key": "staging",
        "name": "Staging",
        "environment_name": "victim-app-staging",
        "alarm_name": "victim-app-staging-5xx",
    },
]


def get_alarm_state(alarm_name: str) -> str:
    response = cloudwatch.describe_alarms(
        AlarmNames=[alarm_name],
    )
    alarms = response.get("MetricAlarms", [])

    if not alarms:
        return "UNKNOWN"

    return alarms[0].get("StateValue", "UNKNOWN")


def environment_details(config: dict) -> dict:
    response = eb.describe_environments(
        ApplicationName="beanstalk-incident-victim",
        EnvironmentNames=[config["environment_name"]],
        IncludeDeleted=False,
    )

    environments = response.get("Environments", [])

    if not environments:
        return {
            **config,
            "status": "NotFound",
            "health": "Grey",
            "region": REGION,
            "platform": None,
            "version": None,
            "url": None,
            "alarm_state": get_alarm_state(config["alarm_name"]),
        }

    environment = environments[0]

    return {
        **config,
        "status": environment.get("Status"),
        "health": environment.get("Health"),
        "region": REGION,
        "platform": environment.get("PlatformArn"),
        "version": environment.get("VersionLabel"),
        "url": environment.get("CNAME"),
        "environment_id": environment.get("EnvironmentId"),
        "alarm_state": get_alarm_state(config["alarm_name"]),
    }


@router.get("")
def list_environments():
    return {
        "environments": [
            environment_details(environment)
            for environment in ENVIRONMENTS
        ]
    }


@router.get("/{environment_key}")
def get_environment(environment_key: str):
    for environment in ENVIRONMENTS:
        if environment["key"] == environment_key:
            return environment_details(environment)

    return {
        "error": "Environment not found",
        "environment": environment_key,
    }
# Beanstalk Incident Copilot

AI-powered incident investigation and root-cause analysis for AWS Elastic Beanstalk.

## Project

Beanstalk Incident Copilot automatically detects incidents, collects telemetry from AWS Elastic Beanstalk and CloudWatch, correlates evidence, and uses Amazon Bedrock to generate an incident diagnosis.

## Architecture

Victim application
→ AWS Elastic Beanstalk
→ CloudWatch
→ EventBridge
→ Incident Copilot
→ Amazon Bedrock
→ DynamoDB
→ React dashboard

## Status

🚧 Hackathon project — development starting soon.
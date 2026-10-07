from bedrock import analyze_incident


evidence = {
    "environment": "victim-production",
    "incident_type": "database_failure",
    "logs": [
        "ERROR database connection refused",
        "ERROR failed to connect to database",
    ],
    "metrics": {
        "http_5xx_rate": 82,
        "latency_seconds": 5.8,
        "cpu_percent": 31,
        "memory_percent": 54,
    },
    "deployment": {
        "recent_deployment": False,
    },
}


result = analyze_incident(evidence)

print("\n=== INCIDENT ANALYSIS ===")
print(result)
# Namespace Explorer – Backend API

This is the backend service for Namespace Explorer, built with Flask and the Kubernetes Python client.  
It exposes RESTful endpoints to retrieve Deployments, Pods, and Services from a given Kubernetes namespace.

---

## Backend Structure

```
backend/
├── __init__.py          # App factory
├── main.py              # Entrypoint for Flask
├── k8s_client.py        # Handles K8s API interactions
├── utils.py             # (Optional) Shared utilities
├── Dockerfile           # Dockerfile for containerization
└── README.md            # You are here
```

---

## API Endpoints

All endpoints return `application/json`.

### Health

`GET /api/health`  
Returns basic application status.

---

### Namespaces

`GET /api/namespaces`  
Returns a list of all available namespaces.

---

### Deployments

`GET /api/deployments?namespace=<your-namespace>`  
Returns all Deployments in the given namespace.

Response example:
```json
[
  {
    "name": "webapp",
    "replicas": 3,
    "ready": 2,
    "images": ["nginx:1.21"]
  }
]
```

---

### Pods

`GET /api/pods?namespace=<your-namespace>`  
Returns all Pods in the given namespace.

Response example:
```json
[
  {
    "name": "webapp-1234",
    "status": "Running",
    "restarts": 1,
    "node": "ip-10-0-0-1",
    "age": "4h"
  }
]
```

---

### Services

`GET /api/services?namespace=<your-namespace>`  
Returns all Services in the given namespace.

Response example:
```json
[
  {
    "name": "webapp-svc",
    "type": "ClusterIP",
    "cluster_ip": "10.0.0.1",
    "ports": [{"port": 80, "targetPort": 8080}]
  }
]
```

---

## Requirements

- Python 3.10+
- Flask 3.x
- kubernetes-client (Python)

---

## 👨‍💻 Usage (Local Dev)

To run manually:

```bash
poetry run python app/main.py
```

Ensure you have a valid `~/.kube/config` for access to the cluster.

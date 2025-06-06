Here's the cleaned-up and focused version of your backend-only `README.md`, ready to copy and paste:

---

# 🧠 Namespace Explorer – Backend API

This is the backend service for **Namespace Explorer**, built with **Flask** and the **Kubernetes Python client**.
It provides RESTful API endpoints to fetch **Deployments**, **Pods**, **Services**, and **Namespaces** from a Kubernetes cluster.

---

## 🧱 Project Structure

```
app/
├── __init__.py          # App factory
├── main.py              # Flask app entrypoint and routing
├── k8s_client.py        # K8s API interaction layer
├── utils.py             # (Optional) Shared utilities
├── Dockerfile           # Container build file
└── README.md            # You are here
```

---

## 🔌 API Endpoints

All responses are `application/json`.

### ✅ Health Check

**`GET /api/health`**
Returns the status of the API.

---

### 📛 Namespaces

**`GET /api/namespaces`**
Lists all available namespaces in the Kubernetes cluster.

---

### 🚀 Deployments

**`GET /api/deployments?namespace=<namespace>`**
Returns Deployments within the given namespace.

**Example:**

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

### 📦 Pods

**`GET /api/pods?namespace=<namespace>`**
Returns Pods within the given namespace.

**Example:**

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

Supports viewing `kube-system` Pods as well:
**`GET /api/pods?namespace=kube-system`**

---

### 🔧 Services

**`GET /api/services?namespace=<namespace>`**
Returns Services within the given namespace.

**Example:**

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

## 📦 Containerization

Build and run the Docker container:

```bash
docker build -t namespace-explorer-backend .
docker run -p 5000:5000 namespace-explorer-backend
```

---

## 🧪 Local Development

### Requirements:

* Python 3.10+
* Poetry
* Valid `~/.kube/config` for cluster access

### Start the server:

```bash
poetry install
poetry run python app/main.py
```
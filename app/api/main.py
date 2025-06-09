from flask import Flask, jsonify, request, Response
from k8s_client import (
    get_namespaces,
    get_deployments,
    get_pods,
    get_services,
    get_all_pods,
    get_all_deployments,
    get_all_services,
    get_pod_logs,
    patch_pod,
    get_pod_full,
    get_deployment_full
)
from flask_cors import CORS
from logger import get_logger
from flasgger import Swagger, swag_from


app = Flask(__name__)
logger = get_logger(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
swagger_template = {
    "tags": [
        {"name": "Utils", "description": "Utils endpoints"},
        {"name": "Namespaces", "description": "Namespace retrieval"},
        {"name": "Pods", "description": "Pod-related operations"},
        {"name": "Deployments", "description": "Deployment-related operations"},
        {"name": "Services", "description": "Service-related operations"}
    ],
    "definitions": {
        "DeploymentModel": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "example": "webapp"},
                "namespace": {"type": "string", "example": "default"},
                "creationTimestamp": {"type": "string", "example": "2024-06-01 12:00:00 UTC"},
                "labels": {"type": "object", "example": {"app": "web"}},
                "annotations": {"type": "object", "example": {}},
                "uid": {"type": "string", "example": "abcd-1234"},
                "resourceVersion": {"type": "string", "example": "101"},
                "generateName": {"type": "string", "example": "webapp-"},
                "replicas": {"type": "string", "example": "3"},
                "availableReplicas": {"type": "string", "example": "2"},
                "strategy": {"type": "string", "example": "RollingUpdate"}
            }
        },
        "PodModel": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "example": "nginx-abc123"},
                "namespace": {"type": "string", "example": "default"},
                "creationTimestamp": {"type": "string", "example": "2024-06-01 12:00:00 UTC"},
                "labels": {"type": "object", "example": {"env": "dev"}},
                "annotations": {"type": "object", "example": {}},
                "uid": {"type": "string", "example": "pod-uid-xyz"},
                "resourceVersion": {"type": "string", "example": "200"},
                "generateName": {"type": "string", "example": "nginx-"},
                "status": {"type": "string", "example": "Running"},
                "node": {"type": "string", "example": "ip-10-0-0-1"},
                "restartCount": {"type": "string", "example": "1"},
                "metadata": {"type": "object", "example": {"labels": {"env": "dev"}}}
            }
        },
        "ServiceModel": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "example": "webapp-svc"},
                "namespace": {"type": "string", "example": "default"},
                "creationTimestamp": {"type": "string", "example": "2024-06-01 12:00:00 UTC"},
                "labels": {"type": "object", "example": {"tier": "frontend"}},
                "annotations": {"type": "object", "example": {}},
                "uid": {"type": "string", "example": "svc-uuid"},
                "resourceVersion": {"type": "string", "example": "501"},
                "generateName": {"type": "string", "example": "webapp-svc-"},
                "type": {"type": "string", "example": "ClusterIP"},
                "clusterIP": {"type": "string", "example": "10.0.0.1"},
                "ports": {
                    "type": "array",
                    "items": {"type": "string"},
                    "example": ["80:8080/TCP"]
                }
            }
        }
    }
}

Swagger(app, template=swagger_template)


@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} | args: {dict(request.args)}")

@app.route("/api/health", methods=["GET"])
def health() -> Response:
    """
    Health check endpoint
    ---
    tags:
      - Utils
    responses:
      200:
        description: API is running
        schema:
          type: object
          properties:
            status:
              type: string
              example: ok
    """
    return jsonify({"status": "ok"})

@app.route("/api/graph", methods=["GET"])
def get_graph() -> Response:
    """
    Get resource graph for a namespace or for the whole cluster (if namespace=all)
    """
    namespace = request.args.get("namespace", "default")

    try:
        if namespace == "all":
            deployments = get_all_deployments()
            services = get_all_services()
            pods = get_all_pods()
        else:
            deployments = get_deployments(namespace)
            services = get_services(namespace)
            pods = get_pods(namespace)
    except Exception as e:
        return jsonify({"error": f"Error fetching resources: {str(e)}"}), 500

    nodes = []
    edges = []

    for pod in pods:
        pod_id = f"{pod['namespace']}/{pod['name']}" if namespace == "all" else pod["name"]
        nodes.append({"id": pod_id, "type": "Pod"})

    for svc in services:
        svc_id = f"{svc['namespace']}/{svc['name']}" if namespace == "all" else svc["name"]
        svc_selector = svc.get("labels", {})
        nodes.append({"id": svc_id, "type": "Service"})

        for pod in pods:
            if all(pod.get("labels", {}).get(k) == v for k, v in svc_selector.items()):
                pod_id = f"{pod['namespace']}/{pod['name']}" if namespace == "all" else pod["name"]
                edges.append({"from": svc_id, "to": pod_id, "relation": "routes_to"})

    for dep in deployments:
        dep_id = f"{dep['namespace']}/{dep['name']}" if namespace == "all" else dep["name"]
        dep_selector = dep.get("labels", {})
        nodes.append({"id": dep_id, "type": "Deployment"})

        for pod in pods:
            if all(pod.get("labels", {}).get(k) == v for k, v in dep_selector.items()):
                pod_id = f"{pod['namespace']}/{pod['name']}" if namespace == "all" else pod["name"]
                edges.append({"from": dep_id, "to": pod_id, "relation": "creates"})

    return jsonify({
        "namespace": namespace,
        "nodes": nodes,
        "edges": edges
    })


@app.route("/api/namespaces", methods=["GET"])
def namespaces() -> Response:
    """
    Get all namespaces
    ---
    tags:
      - Namespaces
    responses:
      200:
        description: List of namespaces
        schema:
          type: array
          items:
            type: string
        examples:
          namespaces:
            value: ["default", "kube-system", "dev"]
    """
    return jsonify(get_namespaces())

@app.route("/api/deployments", methods=["GET"])
def deployments() -> Response:
    """
    Get deployments in a namespace
    ---
    tags:
      - Deployments
    parameters:
      - name: namespace
        in: query
        type: string
        required: false
        default: all
        example: default
    responses:
      200:
        description: List of deployments
        schema:
          type: array
          items:
            $ref: '#/definitions/DeploymentModel'
    """
    namespace: str = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_deployments())
    return jsonify(get_deployments(namespace))

@app.route("/api/deployments/<namespace>/<name>", methods=["GET"])
def get_single_deployment(namespace: str, name: str) -> Response:
    """
    Get detailed info for a specific deployment
    ---
    tags:
      - Deployments
    parameters:
      - name: namespace
        in: path
        type: string
        required: true
        example: default
      - name: name
        in: path
        type: string
        required: true
        example: webapp
    responses:
      200:
        description: Deployment details
        examples:
          deployment:
            value:
              apiVersion: apps/v1
              kind: Deployment
              metadata:
                name: webapp
                namespace: default
              spec:
                replicas: 3
                strategy: RollingUpdate
    """
    try:
        deployment_data = get_deployment_full(namespace=namespace, name=name)
        return jsonify(deployment_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/pods", methods=["GET"])
def pods() -> Response:
    """
    Get pods in a namespace
    ---
    tags:
      - Pods
    parameters:
      - name: namespace
        in: query
        type: string
        required: false
        default: all
        example: default
    responses:
      200:
        description: List of pods
        schema:
          type: array
          items:
            $ref: '#/definitions/PodModel'
    """
    namespace = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_pods())
    return jsonify(get_pods(namespace))

@app.route("/api/pods/<namespace>/<name>", methods=["GET"])
def get_single_pod(namespace: str, name: str) -> Response:
    """
    Get detailed info for a specific pod
    ---
    tags:
      - Pods
    parameters:
      - name: namespace
        in: path
        type: string
        required: true
        example: default
      - name: name
        in: path
        type: string
        required: true
        example: nginx-abc123
    responses:
      200:
        description: Pod details
        examples:
          pod:
            value:
              apiVersion: v1
              kind: Pod
              metadata:
                name: nginx-abc123
                namespace: default
              spec:
                containers:
                  - name: nginx
                    image: nginx:latest
    """
    try:
        pod_data = get_pod_full(namespace=namespace, name=name)
        return jsonify(pod_data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/pods/metadata", methods=["PATCH"])
def update_pod_metadata() -> Response:
    """
    Patch metadata for a pod
    ---
    tags:
      - Pods
    consumes:
      - application/json
    parameters:
      - in: body
        name: body
        required: true
        schema:
          type: object
          properties:
            podName:
              type: string
              example: nginx-abc123
            namespace:
              type: string
              example: default
            metadata:
              type: object
              example:
                labels:
                  env: dev
                  version: v1
    responses:
      200:
        description: Metadata patched successfully
        schema:
          type: object
          properties:
            status:
              type: string
              example: success
    """
    data = request.get_json()
    pod_name = data.get("podName")
    namespace = data.get("namespace", "default")
    metadata = data.get("metadata")

    if not pod_name or not metadata:
        return jsonify({"error": "Missing podName or metadata"}), 400

    allowed_keys = {"labels", "annotations", "finalizers"}
    safe_metadata = {k: v for k, v in metadata.items() if k in allowed_keys}

    if not safe_metadata:
        return jsonify({"error": "No patchable metadata fields provided"}), 400

    try:
        patch_pod(pod_name=pod_name, namespace=namespace, metadata=safe_metadata)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/services", methods=["GET"])
def services() -> Response:
    """
    Get services in a namespace
    ---
    tags:
      - Services
    parameters:
      - name: namespace
        in: query
        type: string
        required: false
        default: all
        example: default
    responses:
      200:
        description: List of services
        schema:
          type: array
          items:
            $ref: '#/definitions/ServiceModel'
    """
    namespace: str = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_services())
    return jsonify(get_services(namespace))

@app.route("/api/logs", methods=["GET"])
def pod_logs() -> Response:
    """
    Get logs for a specific pod
    ---
    tags:
      - Services
    parameters:
      - name: podName
        in: query
        type: string
        required: true
        example: nginx-abc123
      - name: namespace
        in: query
        type: string
        required: false
        default: default
        example: default
    responses:
      200:
        description: Pod logs
        schema:
          type: object
          properties:
            logs:
              type: string
              example: "Starting app...\nListening on port 8080\n"
    """
    pod_name = request.args.get("podName")
    namespace = request.args.get("namespace", "default")
    if not pod_name:
        return jsonify({"error": "Missing podName parameter"}), 400

    try:
        logger.info(f"Fetching logs for pod: {pod_name} in namespace: {namespace}")
        logs = get_pod_logs(pod_name, namespace)
        return jsonify({"logs": logs})
    except Exception as e:
        logger.error(f"Error fetching logs for pod {pod_name} in namespace {namespace}: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

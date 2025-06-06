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
    patch_pod
)
from flask_cors import CORS
from logger import get_logger

app = Flask(__name__)
logger = get_logger(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} | args: {dict(request.args)}")

@app.route("/api/health", methods=["GET"])
def health() -> Response:
    return jsonify({"status": "ok"})

@app.route("/api/namespaces", methods=["GET"])
def namespaces() -> Response:
    return jsonify(get_namespaces())

@app.route("/api/deployments", methods=["GET"])
def deployments() -> Response:
    namespace: str = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_deployments())
    return jsonify(get_deployments(namespace))

@app.route("/api/pods", methods=["GET"])
def pods() -> Response:
    namespace = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_pods())
    return jsonify(get_pods(namespace))

@app.route("/api/pods/metadata", methods=["PATCH"])
def update_pod_metadata() -> Response:
    data = request.get_json()
    pod_name = data.get("podName")
    namespace = data.get("namespace", "default")
    metadata = data.get("metadata")

    if not pod_name or not metadata:
        return jsonify({"error": "Missing podName or metadata"}), 400

    body = {"metadata": metadata}
    try:
        patch_pod(pod_name=pod_name, namespace=namespace, metadata=metadata)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/services", methods=["GET"])
def services() -> Response:
    namespace: str = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_services())
    return jsonify(get_services(namespace))

@app.route("/api/logs", methods=["GET"])
def pod_logs() -> Response:
    pod_name = request.args.get("podName")
    namespace = request.args.get("namespace", "default")
    if not pod_name:
        return jsonify({"error": "Missing podName parameter"}), 400

    try:
        logger.info(f"Fetching logs for pod: {pod_name} in namespace: {namespace}")
        logs = get_pod_logs(pod_name, namespace)
        return jsonify({"logs": logs})
    except Exception as e:
        logger.Error(f"Error fetching logs for pod {pod_name} in namespace {namespace}: {e}")
        return jsonify({"error": str(e)}), 500



if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)

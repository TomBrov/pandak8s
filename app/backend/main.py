from flask import Flask, jsonify, request, Response
from k8s_client import get_namespaces, get_deployments, get_pods, get_services, get_all_pods, get_all_deployments, get_all_services

app = Flask(__name__)

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

@app.route("/api/pods")
def pods() -> Response:
    namespace = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_pods())
    return jsonify(get_pods(namespace))


@app.route("/api/services", methods=["GET"])
def services() -> Response:
    namespace: str = request.args.get("namespace", "all")
    if namespace == "all":
        return jsonify(get_all_services())
    return jsonify(get_services(namespace))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
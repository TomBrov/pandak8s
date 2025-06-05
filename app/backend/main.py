from flask import Flask, jsonify, request, Response
from k8s_client import get_namespaces, get_deployments, get_pods, get_services

app = Flask(__name__)

@app.route("/api/health", methods=["GET"])
def health() -> Response:
    return jsonify({"status": "ok"})

@app.route("/api/namespaces", methods=["GET"])
def namespaces() -> Response:
    return jsonify(get_namespaces())

@app.route("/api/deployments/<string:namespace>", methods=["GET"])
def deployments(namespace: str) -> Response:
    return jsonify(get_deployments(namespace))

@app.route("/api/pods/<string:namespace>", methods=["GET"])
def pods(namespace: str) -> Response:
    return jsonify(get_pods(namespace))

@app.route("/api/services/<string:namespace>", methods=["GET"])
def services(namespace: str) -> Response:
    return jsonify(get_services(namespace))


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
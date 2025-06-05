from kubernetes import client, config
from kubernetes.client import V1Pod, V1Service, V1Deployment
from datetime import datetime, timezone
from typing import List, Dict

try:
    config.load_incluster_config()
except config.config_exception.ConfigException:
    config.load_kube_config()

v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()

def get_namespaces() -> List[str]:
    return [ns.metadata.name for ns in v1.list_namespace().items]

def get_deployments(namespace: str) -> List[Dict]:
    deployments: List[V1Deployment] = apps_v1.list_namespaced_deployment(namespace).items
    return [
        {
            "name": d.metadata.name,
            "replicas": d.spec.replicas,
            "ready": d.status.ready_replicas or 0,
            "images": [c.image for c in d.spec.template.spec.containers]
        }
        for d in deployments
    ]

def get_pods(namespace: str) -> List[Dict]:
    pods: List[V1Pod] = v1.list_namespaced_pod(namespace).items

    def pod_age(pod: V1Pod) -> str:
        start_time = pod.status.start_time
        if not start_time:
            return "N/A"
        age = datetime.now(timezone.utc) - start_time
        return f"{age.total_seconds() // 3600:.0f}h"

    return [
        {
            "name": p.metadata.name,
            "status": p.status.phase,
            "restarts": sum([cs.restart_count for cs in p.status.container_statuses or []]),
            "node": p.spec.node_name,
            "age": pod_age(p)
        }
        for p in pods
    ]

def get_services(namespace: str) -> List[Dict]:
    services: List[V1Service] = v1.list_namespaced_service(namespace).items
    return [
        {
            "name": s.metadata.name,
            "type": s.spec.type,
            "cluster_ip": s.spec.cluster_ip,
            "ports": [{"port": p.port, "targetPort": p.target_port} for p in s.spec.ports]
        }
        for s in services
    ]
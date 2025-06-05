from kubernetes import client, config
from kubernetes.client import V1Pod, V1Service, V1Deployment
from datetime import datetime, timezone
from typing import List, Dict, Any
from logger import get_logger

logger = get_logger(__name__)

try:
    config.load_incluster_config()
    logger.info("Loaded in-cluster Kubernetes config.")
except config.config_exception.ConfigException:
    config.load_kube_config()
    logger.info("Loaded local kube config.")

v1 = client.CoreV1Api()
apps_v1 = client.AppsV1Api()

def format_datetime(dt: datetime) -> str:
    if not dt:
        return "N/A"
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

def format_k8s_resource(obj: Any, kind: str) -> Dict[str, Any]:
    metadata = obj.metadata
    base = {
        "name": metadata.name,
        "namespace": metadata.namespace,
        "creationTimestamp": format_datetime(metadata.creation_timestamp)
    }

    if kind == "pod":
        restarts = sum([cs.restart_count for cs in obj.status.container_statuses or []])
        return {
            **base,
            "status": obj.status.phase or "Unknown",
            "node": obj.spec.node_name or "N/A",
            "restartCount": str(restarts),
        }

    elif kind == "service":
        ports = obj.spec.ports or []
        port_list = [f"{p.port}:{p.target_port}/{p.protocol}" for p in ports]
        return {
            **base,
            "type": obj.spec.type or "ClusterIP",
            "clusterIP": obj.spec.cluster_ip or "None",
            "ports": port_list
        }

    elif kind == "deployment":
        replicas = obj.spec.replicas or 0
        available = obj.status.available_replicas or 0
        strategy = obj.spec.strategy.type if obj.spec.strategy else "None"
        return {
            **base,
            "replicas": str(replicas),
            "availableReplicas": str(available),
            "strategy": strategy
        }

    return base

def get_namespaces() -> List[str]:
    logger.info("Fetching namespaces...")
    try:
        result = [ns.metadata.name for ns in v1.list_namespace().items]
        logger.info(f"Found {len(result)} namespaces.")
        return result
    except Exception as e:
        logger.error(f"Failed to fetch namespaces: {e}")
        return []

def get_pods(namespace: str) -> List[Dict[str, Any]]:
    logger.info(f"Fetching pods in namespace: {namespace}")
    try:
        pods = v1.list_namespaced_pod(namespace).items
        return [format_k8s_resource(pod, "pod") for pod in pods]
    except Exception as e:
        logger.error(f"Error fetching pods: {e}")
        return []

def get_all_pods() -> List[Dict[str, Any]]:
    logger.info("Fetching all pods in all namespaces...")
    try:
        pods = v1.list_pod_for_all_namespaces(watch=False).items
        return [format_k8s_resource(pod, "pod") for pod in pods]
    except Exception as e:
        logger.error(f"Error fetching all pods: {e}")
        return []

def get_services(namespace: str) -> List[Dict[str, Any]]:
    logger.info(f"Fetching services in namespace: {namespace}")
    try:
        services = v1.list_namespaced_service(namespace).items
        return [format_k8s_resource(svc, "service") for svc in services]
    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        return []

def get_all_services() -> List[Dict[str, Any]]:
    logger.info("Fetching all services in all namespaces...")
    try:
        services = v1.list_service_for_all_namespaces(watch=False).items
        return [format_k8s_resource(svc, "service") for svc in services]
    except Exception as e:
        logger.error(f"Error fetching all services: {e}")
        return []

def get_deployments(namespace: str) -> List[Dict[str, Any]]:
    logger.info(f"Fetching deployments in namespace: {namespace}")
    try:
        deployments = apps_v1.list_namespaced_deployment(namespace).items
        return [format_k8s_resource(dep, "deployment") for dep in deployments]
    except Exception as e:
        logger.error(f"Error fetching deployments: {e}")
        return []

def get_all_deployments() -> List[Dict[str, Any]]:
    logger.info("Fetching all deployments in all namespaces...")
    try:
        deployments = apps_v1.list_deployment_for_all_namespaces(watch=False).items
        return [format_k8s_resource(dep, "deployment") for dep in deployments]
    except Exception as e:
        logger.error(f"Error fetching all deployments: {e}")
        return []
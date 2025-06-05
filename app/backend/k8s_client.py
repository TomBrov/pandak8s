from kubernetes import client, config
from kubernetes.client import V1Pod, V1Service, V1Deployment
from datetime import datetime, timezone
from typing import List, Dict
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


def get_namespaces() -> List[str]:
    logger.info("Fetching namespaces...")
    try:
        result = [ns.metadata.name for ns in v1.list_namespace().items]
        logger.info(f"Found {len(result)} namespaces.")
        return result
    except Exception as e:
        logger.error(f"Failed to fetch namespaces: {e}")
        return []


def get_deployments(namespace: str) -> List[Dict]:
    logger.info(f"Fetching deployments in namespace: {namespace}")
    try:
        deployments: List[V1Deployment] = apps_v1.list_namespaced_deployment(namespace).items
        logger.info(f"Found {len(deployments)} deployments.")
        return [
            {
                "name": d.metadata.name,
                "replicas": d.spec.replicas,
                "ready": d.status.ready_replicas or 0,
                "images": [c.image for c in d.spec.template.spec.containers]
            }
            for d in deployments
        ]
    except Exception as e:
        logger.error(f"Error fetching deployments: {e}")
        return []


def get_pods(namespace: str) -> List[Dict]:
    logger.info(f"Fetching pods in namespace: {namespace}")
    try:
        pods: List[V1Pod] = v1.list_namespaced_pod(namespace).items

        def pod_age(pod: V1Pod) -> str:
            start_time = pod.status.start_time
            if not start_time:
                return "0h"  # or "Pending" if you prefer
            age_timedelta = datetime.now(timezone.utc) - start_time
            total_seconds = age_timedelta.total_seconds()
            days = int(total_seconds // 86400)
            hours = int((total_seconds % 86400) // 3600)
            minutes = int((total_seconds % 3600) // 60)

            if days > 0:
                return f"{days}d {hours}h"
            elif hours > 0:
                return f"{hours}h"
            else:
                return f"{minutes}m"

        result = [
            {
                "name": p.metadata.name,
                "status": p.status.phase,
                "restarts": sum([cs.restart_count for cs in p.status.container_statuses or []]),
                "node": p.spec.node_name,
                "age": pod_age(p)
            }
            for p in pods
        ]
        logger.info(f"Found {len(result)} pods.")
        return result
    except Exception as e:
        logger.error(f"Error fetching pods: {e}")
        return []


def get_services(namespace: str) -> List[Dict]:
    logger.info(f"Fetching services in namespace: {namespace}")
    try:
        services: List[V1Service] = v1.list_namespaced_service(namespace).items
        logger.info(f"Found {len(services)} services.")
        return [
            {
                "name": s.metadata.name,
                "type": s.spec.type,
                "cluster_ip": s.spec.cluster_ip,
                "ports": [{"port": p.port, "targetPort": p.target_port} for p in s.spec.ports]
            }
            for s in services
        ]
    except Exception as e:
        logger.error(f"Error fetching services: {e}")
        return []


def get_all_pods() -> List[Dict[str, str]]:
    logger.info("Fetching all pods in all namespaces...")
    try:
        pods: client.V1PodList = v1.list_pod_for_all_namespaces(watch=False)
        pod_list: List[Dict[str, str]] = []

        for pod in pods.items:
            restart_count = sum([c.restart_count for c in (pod.status.container_statuses or [])])
            pod_list.append({
                "name": pod.metadata.name,
                "namespace": pod.metadata.namespace,
                "status": pod.status.phase,
                "node": pod.spec.node_name,
                "restartCount": str(restart_count),
                "creationTimestamp": format_datetime(pod.metadata.creation_timestamp)
            })

        logger.info(f"Found {len(pod_list)} pods.")
        return pod_list
    except Exception as e:
        logger.error(f"Error fetching all pods: {e}")
        return []


def get_all_services() -> List[Dict[str, str]]:
    logger.info("Fetching all services in all namespaces...")
    try:
        services: client.V1ServiceList = v1.list_service_for_all_namespaces(watch=False)
        service_list: List[Dict[str, str]] = []

        for svc in services.items:
            ports = svc.spec.ports or []
            port_list = [f"{p.port}:{p.target_port}/{p.protocol}" for p in ports]
            service_list.append({
                "name": svc.metadata.name,
                "namespace": svc.metadata.namespace,
                "type": svc.spec.type,
                "clusterIP": svc.spec.cluster_ip or "None",
                "ports": port_list,
                "creationTimestamp": format_datetime(svc.metadata.creation_timestamp)
            })

        logger.info(f"Found {len(service_list)} services.")
        return service_list
    except Exception as e:
        logger.error(f"Error fetching all services: {e}")
        return []


def get_all_deployments() -> List[Dict[str, str]]:
    logger.info("Fetching all deployments in all namespaces...")
    try:
        deployments: client.V1DeploymentList = apps_v1.list_deployment_for_all_namespaces(watch=False)
        deployment_list: List[Dict[str, str]] = []

        for deployment in deployments.items:
            replicas = deployment.spec.replicas or 0
            available = deployment.status.available_replicas or 0
            strategy = deployment.spec.strategy.type if deployment.spec.strategy else "None"
            deployment_list.append({
                "name": deployment.metadata.name,
                "namespace": deployment.metadata.namespace,
                "replicas": str(replicas),
                "availableReplicas": str(available),
                "strategy": strategy,
                "creationTimestamp": format_datetime(deployment.metadata.creation_timestamp)
            })

        logger.info(f"Found {len(deployment_list)} deployments.")
        return deployment_list
    except Exception as e:
        logger.error(f"Error fetching all deployments: {e}")
        return []

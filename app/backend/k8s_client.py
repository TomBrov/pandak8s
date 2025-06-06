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

# Utility function to remove nulls and empty structures from a dictionary or list
def remove_nulls(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: remove_nulls(v) for k, v in obj.items() if v is not None and remove_nulls(v) != {} and remove_nulls(v) != []}
    elif isinstance(obj, list):
        return [remove_nulls(i) for i in obj if i is not None]
    else:
        return obj

def format_datetime(dt: datetime) -> str:
    if not dt:
        return "N/A"
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

def format_k8s_resource(obj: Any, kind: str) -> Dict[str, Any]:
    metadata = obj.metadata

    base = {
        "name": metadata.name,
        "namespace": metadata.namespace,
        "creationTimestamp": format_datetime(metadata.creation_timestamp),
        "labels": metadata.labels or {},
        "annotations": metadata.annotations or {},
        "uid": metadata.uid,
        "resourceVersion": metadata.resource_version,
        "generateName": metadata.generate_name,
    }

    if kind == "pod":
        restarts = sum([cs.restart_count for cs in obj.status.container_statuses or []])
        return {
            **base,
            "status": obj.status.phase or "Unknown",
            "node": obj.spec.node_name or "N/A",
            "restartCount": str(restarts),
            "metadata": obj.metadata.to_dict()
        }

    elif kind == "service":
        ports = obj.spec.ports or []
        port_list = [f"{p.port}:{p.target_port}/{p.protocol}" for p in ports]
        return {
            **base,
            "type": obj.spec.type or "ClusterIP",
            "clusterIP": obj.spec.cluster_ip or "None",
            "ports": port_list,
        }

    elif kind == "deployment":
        replicas = obj.spec.replicas or 0
        available = obj.status.available_replicas or 0
        strategy = obj.spec.strategy.type if obj.spec.strategy else "None"
        return {
            **base,
            "replicas": str(replicas),
            "availableReplicas": str(available),
            "strategy": strategy,
        }

    return base

# Namespaces
def get_namespaces() -> List[str]:
    logger.info("Fetching namespaces...")
    try:
        result = [ns.metadata.name for ns in v1.list_namespace().items]
        logger.info(f"Found {len(result)} namespaces.")
        return result
    except Exception as e:
        logger.error(f"Failed to fetch namespaces: {e}")
        return []

# Pods methods
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

def get_pod_full(namespace: str, name: str) -> Dict[str, Any]:
    logger.info(f"Fetching structured pod object for {name} in namespace {namespace}")
    try:
        pod: V1Pod = v1.read_namespaced_pod(name=name, namespace=namespace)

        return remove_nulls({
            "apiVersion": "v1",
            "items": [
                {
                    "apiVersion": "v1",
                    "kind": "Pod",
                    "metadata": {
                        "name": pod.metadata.name,
                        "namespace": pod.metadata.namespace,
                        "uid": pod.metadata.uid,
                        "creationTimestamp": pod.metadata.creation_timestamp.isoformat(),
                        "labels": pod.metadata.labels,
                        "resourceVersion": pod.metadata.resource_version,
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": c.name,
                                "image": c.image,
                                "imagePullPolicy": c.image_pull_policy,
                                "resources": c.resources.to_dict() if c.resources else {},
                                "terminationMessagePath": c.termination_message_path,
                                "terminationMessagePolicy": c.termination_message_policy,
                                "volumeMounts": [
                                    {
                                        "mountPath": vm.mount_path,
                                        "name": vm.name,
                                        "readOnly": vm.read_only
                                    } for vm in (c.volume_mounts or [])
                                ]
                            } for c in pod.spec.containers
                        ],
                        "dnsPolicy": pod.spec.dns_policy,
                        "enableServiceLinks": pod.spec.enable_service_links,
                        "nodeName": pod.spec.node_name,
                        "preemptionPolicy": pod.spec.preemption_policy,
                        "priority": pod.spec.priority,
                        "restartPolicy": pod.spec.restart_policy,
                        "schedulerName": pod.spec.scheduler_name,
                        "securityContext": pod.spec.security_context.to_dict() if pod.spec.security_context else {},
                        "serviceAccount": pod.spec.service_account,
                        "serviceAccountName": pod.spec.service_account_name,
                        "terminationGracePeriodSeconds": pod.spec.termination_grace_period_seconds,
                        "tolerations": [t.to_dict() for t in pod.spec.tolerations or []],
                        "volumes": [v.to_dict() for v in pod.spec.volumes or []],
                    }
                }
            ]
        })
    except Exception as e:
        logger.error(f"Error fetching full structured pod object: {e}")
        raise


def patch_pod(pod_name: str, namespace: str, metadata: Dict[str, Any]) -> None:
    logger.info(f"Patching pod {pod_name} in namespace {namespace} with metadata: {metadata}")
    body = {"metadata": metadata}
    try:
        v1.patch_namespaced_pod(name=pod_name, namespace=namespace, body=body)
        logger.info(f"Successfully patched pod {pod_name}.")
    except Exception as e:
        logger.error(f"Error patching pod {pod_name}: {e}")
        raise e

# Services methods
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

# Deployments methods
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

def get_deployment_full(namespace: str, name: str) -> Dict[str, Any]:
    logger.info(f"Fetching structured deployment object for {name} in namespace {namespace}")
    try:
        dep: V1Deployment = apps_v1.read_namespaced_deployment(name=name, namespace=namespace)

        return remove_nulls({
            "apiVersion": "apps/v1",
            "kind": "Deployment",
            "metadata": {
                "name": dep.metadata.name,
                "namespace": dep.metadata.namespace,
                "uid": dep.metadata.uid,
                "creationTimestamp": dep.metadata.creation_timestamp.isoformat(),
                "labels": dep.metadata.labels,
                "annotations": dep.metadata.annotations,
                "resourceVersion": dep.metadata.resource_version,
            },
            "spec": {
                "replicas": dep.spec.replicas,
                "strategy": dep.spec.strategy.type if dep.spec.strategy else None,
                "selector": dep.spec.selector.match_labels if dep.spec.selector else {},
                "template": {
                    "metadata": {
                        "labels": dep.spec.template.metadata.labels
                    },
                    "spec": {
                        "containers": [
                            {
                                "name": c.name,
                                "image": c.image,
                                "imagePullPolicy": c.image_pull_policy,
                                "resources": c.resources.to_dict() if c.resources else {},
                                "env": [e.to_dict() for e in c.env or []],
                                "volumeMounts": [
                                    {
                                        "mountPath": vm.mount_path,
                                        "name": vm.name,
                                        "readOnly": vm.read_only
                                    } for vm in (c.volume_mounts or [])
                                ]
                            } for c in dep.spec.template.spec.containers
                        ],
                        "volumes": [v.to_dict() for v in dep.spec.template.spec.volumes or []],
                        "restartPolicy": dep.spec.template.spec.restart_policy,
                        "serviceAccountName": dep.spec.template.spec.service_account_name
                    }
                }
            }
        })

    except Exception as e:
        logger.error(f"Error fetching full structured deployment object: {e}")
        raise


# Logs methods
def get_pod_logs(pod_name: str, namespace: str) -> str:
    logger.info(f"Fetching logs for pod: {pod_name} in namespace: {namespace}")
    try:
        log = v1.read_namespaced_pod_log(name=pod_name, namespace=namespace, since_seconds=3600)
        return log
    except Exception as e:
        logger.error(f"Error fetching logs for pod {pod_name}: {e}")
        return f"Error fetching logs: {str(e)}"
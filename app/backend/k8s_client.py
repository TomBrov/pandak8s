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

def get_all_pods() -> List[Dict[str, str]]:
    pods: client.V1PodList = v1.list_pod_for_all_namespaces(watch=False)

    pod_list: List[Dict[str, str]] = []

    for pod in pods.items:
        restart_count = sum(
            [c.restart_count for c in (pod.status.container_statuses or [])]
        )

        pod_list.append({
            "name": pod.metadata.name,
            "namespace": pod.metadata.namespace,
            "status": pod.status.phase,
            "node": pod.spec.node_name,
            "restartCount": str(restart_count),
            "creationTimestamp": pod.metadata.creation_timestamp.isoformat()
        })

    return pod_list

def get_all_services() -> List[Dict[str, str]]:
    services: client.V1ServiceList = v1.list_service_for_all_namespaces(watch=False)

    service_list: List[Dict[str, str]] = []

    for svc in services.items:  # type: V1Service
        ports = svc.spec.ports or []
        port_str = ", ".join([
            f"{p.port}:{p.target_port}/{p.protocol}" for p in ports
        ])

        service_list.append({
            "name": svc.metadata.name,
            "namespace": svc.metadata.namespace,
            "type": svc.spec.type,
            "clusterIP": svc.spec.cluster_ip or "None",
            "ports": port_str,
            "creationTimestamp": svc.metadata.creation_timestamp.isoformat()
        })

    return service_list

def get_all_deployments() -> List[Dict[str, str]]:
    deployments: client.V1DeploymentList = apps_v1.list_deployment_for_all_namespaces(watch=False)

    deployment_list: List[Dict[str, str]] = []

    for deployment in deployments.items:  # type: V1Deployment
        replicas = deployment.spec.replicas or 0
        available = deployment.status.available_replicas or 0
        strategy = deployment.spec.strategy.type if deployment.spec.strategy else "None"

        deployment_list.append({
            "name": deployment.metadata.name,
            "namespace": deployment.metadata.namespace,
            "replicas": str(replicas),
            "availableReplicas": str(available),
            "strategy": strategy,
            "creationTimestamp": deployment.metadata.creation_timestamp.isoformat()
        })

    return deployment_list
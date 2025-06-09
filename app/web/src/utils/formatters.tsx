export const formatAge = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (diffDays > 0) return `${diffDays}d`;
        if (diffHours > 0) return `${diffHours}h`;
        return '<1h';
    } catch {
        return 'N/A';
    }
};

export const formatPorts = (ports: string[] | undefined): string => {
    if (!ports || !Array.isArray(ports)) return 'N/A';
    return ports.join(', ');
};

export const getServiceTypeColor = (type?: string): string => {
    switch (type?.toLowerCase()) {
        case 'clusterip':
            return 'bg-blue-100 text-blue-800';
        case 'nodeport':
            return 'bg-green-100 text-green-800';
        case 'loadbalancer':
            return 'bg-purple-100 text-purple-800';
        case 'externalname':
            return 'bg-orange-100 text-orange-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getPodStatusColor = (status?: string): string => {
    switch (status?.toLowerCase()) {
        case 'running':
            return 'bg-green-100 text-green-800';
        case 'pending':
            return 'bg-yellow-100 text-yellow-800';
        case 'failed':
        case 'error':
            return 'bg-red-100 text-red-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
};

export const getHealthStatus = (desired: number, available: number) => {
    if (available === desired && available > 0) {
        return { status: 'Healthy', color: 'bg-green-100 text-green-800' };
    }
    if (available > 0 && available < desired) {
        return { status: 'Degraded', color: 'bg-yellow-100 text-yellow-800' };
    }
    if (available === 0) {
        return { status: 'Failed', color: 'bg-red-100 text-red-800' };
    }
    return { status: 'Unknown', color: 'bg-gray-100 text-gray-800' };
};

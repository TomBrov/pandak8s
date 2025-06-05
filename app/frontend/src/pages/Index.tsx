import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Package, Rocket, Settings, Search, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { API_BASE_URL } from '../config';

const Index = () => {
  const [namespace, setNamespace] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: podsData, isLoading: podsLoading, error: podsError } = useQuery({
    queryKey: ['pods', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/pods?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch pods');
      return response.json();
    },
  });

  const { data: deploymentsData, isLoading: deploymentsLoading, error: deploymentsError } = useQuery({
    queryKey: ['deployments', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/deployments?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    },
  });

  const { data: servicesData, isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['services', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/services?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  const { data: backendStatus } = useQuery({
    queryKey: ['backend-status'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/`);
      return response.ok;
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast({
      title: "Refreshing data",
      description: "Fetching latest cluster information...",
    });
  };

  const filterByName = (items: any[], nameField: string = 'name') => {
    if (!searchFilter) return items || [];
    return (items || []).filter(item =>
        item[nameField]?.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  const getServiceTypeColor = (type: string) => {
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

  const formatPorts = (ports: any[]) => {
    if (!ports || !Array.isArray(ports)) return 'N/A';
    return ports.map(port => {
      const protocol = port.protocol || 'TCP';
      const targetPort = port.targetPort ? `:${port.targetPort}` : '';
      return `${port.port}${targetPort}/${protocol}`;
    }).join(', ');
  };

  const isLoading = podsLoading || deploymentsLoading || servicesLoading;
  const hasError = podsError || deploymentsError || servicesError;

  const runningPods = (podsData || []).filter(pod => pod.status === 'Running').length;
  const totalPods = (podsData || []).length;
  const availableDeployments = (deploymentsData || []).filter(dep => dep.available_replicas > 0).length;
  const totalDeployments = (deploymentsData || []).length;
  const activeServices = (servicesData || []).length;

  const formatAge = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return '<1h';
  };

  return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-3xl">🐼</span>
            <h1 className="text-3xl font-bold text-gray-900">PandaK8S Dashboard</h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Package className="h-5 w-5 text-blue-500" />
                  <span>Pods</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {runningPods}/{totalPods}
                </div>
                <p className="text-sm text-gray-600">Running/Total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Rocket className="h-5 w-5 text-green-500" />
                  <span>Deployments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {availableDeployments}/{totalDeployments}
                </div>
                <p className="text-sm text-gray-600">Available/Total</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Settings className="h-5 w-5 text-purple-500" />
                  <span>Services</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {activeServices}
                </div>
                <p className="text-sm text-gray-600">Active Services</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium">Namespace:</label>
                  <Select value={namespace} onValueChange={setNamespace}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Namespaces</SelectItem>
                      <SelectItem value="default">default</SelectItem>
                      <SelectItem value="kube-system">kube-system</SelectItem>
                      <SelectItem value="kube-public">kube-public</SelectItem>
                      <SelectItem value="monitoring">monitoring</SelectItem>
                      <SelectItem value="ingress-nginx">ingress-nginx</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 flex-1">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                      placeholder="Filter by name..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="flex-1 max-w-sm"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <Button
                      onClick={handleRefresh}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="flex items-center space-x-2"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>

                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${backendStatus ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-gray-600">
                    {backendStatus ? 'Connected' : 'Disconnected'}
                  </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {hasError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="py-4">
                  <p className="text-red-700">
                    Unable to connect to the Kubernetes API. Please check your backend connection.
                  </p>
                </CardContent>
              </Card>
          )}

          {/* Pods Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-blue-500" />
                <span>Pods</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Node</TableHead>
                    <TableHead>Restarts</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByName(podsData, 'name').map((pod, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{pod.name}</TableCell>
                        <TableCell>{pod.namespace}</TableCell>
                        <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                          pod.status === 'Running' ? 'bg-green-100 text-green-800' :
                              pod.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                      }`}>
                        {pod.status}
                      </span>
                        </TableCell>
                        <TableCell>{pod.node || 'N/A'}</TableCell>
                        <TableCell>{pod.restarts || 0}</TableCell>
                        <TableCell>{pod.start_time ? formatAge(pod.start_time) : 'N/A'}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filterByName(podsData, 'name').length === 0 && !podsLoading && (
                  <div className="text-center py-4 text-gray-500">No pods found</div>
              )}
            </CardContent>
          </Card>

          {/* Deployments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Rocket className="h-5 w-5 text-green-500" />
                <span>Deployments</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Replicas</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Strategy</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByName(deploymentsData, 'name').map((deployment, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{deployment.name}</TableCell>
                        <TableCell>{deployment.namespace}</TableCell>
                        <TableCell>{deployment.desired_replicas || 0}</TableCell>
                        <TableCell>{deployment.available_replicas || 0}</TableCell>
                        <TableCell>{deployment.strategy || 'RollingUpdate'}</TableCell>
                        <TableCell>{deployment.creation_time ? formatAge(deployment.creation_time) : 'N/A'}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filterByName(deploymentsData, 'name').length === 0 && !deploymentsLoading && (
                  <div className="text-center py-4 text-gray-500">No deployments found</div>
              )}
            </CardContent>
          </Card>

          {/* Services Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <span>Services</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Namespace</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Cluster IP</TableHead>
                    <TableHead>Ports</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByName(servicesData, 'name').map((service, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{service.name}</TableCell>
                        <TableCell>{service.namespace}</TableCell>
                        <TableCell>
                      <span className={`text-xs px-2 py-1 rounded-full ${getServiceTypeColor(service.type)}`}>
                        {service.type}
                      </span>
                        </TableCell>
                        <TableCell>{service.cluster_ip}</TableCell>
                        <TableCell className="font-mono text-sm">{formatPorts(service.ports)}</TableCell>
                        <TableCell>{service.creation_time ? formatAge(service.creation_time) : 'N/A'}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filterByName(servicesData, 'name').length === 0 && !servicesLoading && (
                  <div className="text-center py-4 text-gray-500">No services found</div>
              )}
            </CardContent>
          </Card>
        </div>
      </Layout>
  );
};

export default Index;

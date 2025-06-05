import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Rocket, Settings, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { API_BASE_URL } from '../config';
import {
  formatAge,
  formatPorts,
  getHealthStatus,
  getPodStatusColor,
  getServiceTypeColor
} from '@/utils/formatters';

const Index = () => {
  const [namespace, setNamespace] = useState('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data: podsData = [], isLoading: podsLoading } = useQuery({
    queryKey: ['pods', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/pods?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch pods');
      return response.json();
    },
  });

  const { data: deploymentsData = [], isLoading: deploymentsLoading } = useQuery({
    queryKey: ['deployments', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/deployments?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    },
  });

  const { data: servicesData = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['services', namespace, refreshKey],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/services?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
  });

  const { data: backendStatus } = useQuery({
    queryKey: ['backend-status'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/health`);
      return res.ok;
    },
    refetchInterval: 30000,
  });

  const filterByName = (items: any[], field = 'name') => {
    if (!searchFilter) return items;
    return items.filter(item => item[field]?.toLowerCase().includes(searchFilter.toLowerCase()));
  };

  const isLoading = podsLoading || deploymentsLoading || servicesLoading;

  return (
      <Layout>
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center space-x-2 mb-6">
            <span className="text-3xl">🐼</span>
            <h1 className="text-3xl font-bold text-gray-900">PandaK8S Dashboard</h1>
          </div>

          <Card>
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
                <NamespaceDropdown selectedNamespace={namespace} onNamespaceChange={setNamespace} />
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
                  <Button onClick={() => setRefreshKey(k => k + 1)} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4" /> Refresh
                  </Button>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${backendStatus ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-gray-600">
                      {backendStatus ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  {filterByName(podsData).map((pod, i) => (
                      <TableRow key={i}>
                        <TableCell>{pod.name}</TableCell>
                        <TableCell>{pod.namespace}</TableCell>
                        <TableCell>
                          <Badge className={getPodStatusColor(pod.status)}>{pod.status}</Badge>
                        </TableCell>
                        <TableCell>{pod.node}</TableCell>
                        <TableCell>{pod.restartCount}</TableCell>
                        <TableCell>{formatAge(pod.creationTimestamp)}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
                    <TableHead>Status</TableHead>
                    <TableHead>Age</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filterByName(deploymentsData).map((deployment, i) => {
                    const desired = Number(deployment.replicas);
                    const available = Number(deployment.availableReplicas);
                    const health = getHealthStatus(desired, available);
                    return (
                        <TableRow key={i}>
                          <TableCell>{deployment.name}</TableCell>
                          <TableCell>{deployment.namespace}</TableCell>
                          <TableCell>{desired}</TableCell>
                          <TableCell>{available}</TableCell>
                          <TableCell>{deployment.strategy}</TableCell>
                          <TableCell><Badge className={health.color}>{health.status}</Badge></TableCell>
                          <TableCell>{formatAge(deployment.creationTimestamp)}</TableCell>
                        </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

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
                  {filterByName(servicesData).map((service, i) => (
                      <TableRow key={i}>
                        <TableCell>{service.name}</TableCell>
                        <TableCell>{service.namespace}</TableCell>
                        <TableCell>
                          <Badge className={getServiceTypeColor(service.type)}>{service.type}</Badge>
                        </TableCell>
                        <TableCell>{service.clusterIP}</TableCell>
                        <TableCell>{formatPorts(service.ports)}</TableCell>
                        <TableCell>{formatAge(service.creationTimestamp)}</TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </Layout>
  );
};

export default Index;

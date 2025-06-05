
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '../config';


const Services = () => {
  const [namespace, setNamespace] = useState('default');

  const { data: servicesData, isLoading, error, refetch } = useQuery({
    queryKey: ['services', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/services?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch services');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

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

  return (
    <Layout
      showNamespaceSelector
      onNamespaceChange={setNamespace}
      currentNamespace={namespace}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Settings className="h-6 w-6 text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900">Services</h1>
            </div>
            <p className="text-gray-600">
              Network services in the <span className="font-medium text-purple-600">{namespace}</span> namespace
            </p>
          </div>
          
          <Button
            onClick={() => refetch()}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Services Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Services in {namespace}</span>
              {isLoading && (
                <div className="animate-spin h-4 w-4 border-2 border-purple-500 rounded-full border-t-transparent"></div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️ Failed to load services</div>
                <p className="text-gray-600">Unable to connect to the Kubernetes API</p>
                <Button onClick={() => refetch()} className="mt-4" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Cluster IP</TableHead>
                      <TableHead>Ports</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : servicesData?.length > 0 ? (
                      servicesData.map((service: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {service.name || service.metadata?.name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <Badge className={getServiceTypeColor(service.type || service.spec?.type)}>
                              {service.type || service.spec?.type || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {service.cluster_ip || service.spec?.clusterIP || 'None'}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {formatPorts(service.ports || service.spec?.ports)}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                          No services found in {namespace} namespace
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Services;

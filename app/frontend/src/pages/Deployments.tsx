
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
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
import { Rocket, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '../config';


const Deployments = () => {
  const [namespace, setNamespace] = useState('default');

  const { data: deploymentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['deployments', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/deployments?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  const getHealthStatus = (desired: number, available: number) => {
    if (available === desired && available > 0) {
      return { status: 'Healthy', color: 'bg-green-100 text-green-800' };
    } else if (available > 0 && available < desired) {
      return { status: 'Degraded', color: 'bg-yellow-100 text-yellow-800' };
    } else if (available === 0) {
      return { status: 'Failed', color: 'bg-red-100 text-red-800' };
    }
    return { status: 'Unknown', color: 'bg-gray-100 text-gray-800' };
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
              <Rocket className="h-6 w-6 text-green-500" />
              <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
            </div>
            <p className="text-gray-600">
              Manage deployments in the <span className="font-medium text-green-600">{namespace}</span> namespace
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

        {/* Deployments Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Deployments in {namespace}</span>
              {isLoading && (
                <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
              )}
            </CardTitle>
            <NamespaceDropdown
              selectedNamespace={namespace}
              onNamespaceChange={setNamespace}
            />
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="text-center py-8">
                <div className="text-red-500 mb-2">⚠️ Failed to load deployments</div>
                <p className="text-gray-600">Unable to connect to the Kubernetes API</p>
                <Button onClick={() => refetch()} className="mt-4" variant="outline">
                  Try Again
                </Button>
              </div>
            ) : deploymentsData && deploymentsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                ➤ No deployments found in the selected namespace.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deployment Name</TableHead>
                      <TableHead>Namespace</TableHead>
                      <TableHead>Desired Replicas</TableHead>
                      <TableHead>Available Replicas</TableHead>
                      <TableHead>Status</TableHead>
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
                          <TableCell>
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      deploymentsData?.map((deployment: any, index: number) => {
                        const desired = deployment.desired_replicas || deployment.spec?.replicas || 0;
                        const available = deployment.available_replicas || deployment.status?.availableReplicas || 0;
                        const health = getHealthStatus(desired, available);
                        
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {deployment.name || deployment.metadata?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {deployment.namespace || deployment.metadata?.namespace || namespace}
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{desired}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{available}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={health.color}>
                                {health.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })
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

export default Deployments;

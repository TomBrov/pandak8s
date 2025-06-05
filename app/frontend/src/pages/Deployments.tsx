import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Rocket, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '../config';
import { formatAge, getHealthStatus } from '@/utils/formatters';

const Deployments = () => {
  const [namespace, setNamespace] = useState('all');

  const { data: deploymentsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deployments', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/deployments?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    },
    refetchInterval: 30000,
  });

  return (
      <Layout showNamespaceSelector onNamespaceChange={setNamespace} currentNamespace={namespace}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Rocket className="h-6 w-6 text-green-500" />
                <h1 className="text-2xl font-bold text-gray-900">Deployments</h1>
              </div>
              <p className="text-gray-600">
                {namespace === 'all'
                    ? 'Manage Deployments in All namespaces'
                    : <>Manage Deployments in the <span className="font-medium text-green-600">{namespace}</span> namespace</>}
              </p>
            </div>
            <Button onClick={() => refetch()} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Deployments in {namespace}</span>
                {isLoading && (
                    <div className="animate-spin h-4 w-4 border-2 border-green-500 rounded-full border-t-transparent"></div>
                )}
              </CardTitle>
              <NamespaceDropdown selectedNamespace={namespace} onNamespaceChange={setNamespace} />
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
              ) : deploymentsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ➤ No deployments found in the selected namespace.
                  </div>
              ) : (
                  <div className="overflow-x-auto">
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
                        {deploymentsData.map((deployment: any, index: number) => {
                          const desired = Number(deployment.replicas || 0);
                          const available = Number(deployment.availableReplicas || 0);
                          const health = getHealthStatus(desired, available);

                          return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{deployment.name}</TableCell>
                                <TableCell>{deployment.namespace}</TableCell>
                                <TableCell>{desired}</TableCell>
                                <TableCell>{available}</TableCell>
                                <TableCell>{deployment.strategy || 'RollingUpdate'}</TableCell>
                                <TableCell>
                                  <Badge className={health.color}>{health.status}</Badge>
                                </TableCell>
                                <TableCell>{formatAge(deployment.creationTimestamp)}</TableCell>
                              </TableRow>
                          );
                        })}
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

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { formatAge } from '@/utils/formatters';

const Deployments = () => {
  const [namespace, setNamespace] = useState('all');
  const [selectedDeployment, setSelectedDeployment] = useState<any>(null);
  const [deploymentDetails, setDeploymentDetails] = useState<any>(null);

  const { data: deploymentsData = [], isLoading, error, refetch } = useQuery({
    queryKey: ['deployments', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/deployments?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch deployments');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const fetchDeploymentDetails = async (deployment: any) => {
    setSelectedDeployment(deployment);
    const response = await fetch(
        `${API_BASE_URL}/api/deployments/${deployment.namespace}/${deployment.name}`
    );
    if (response.ok) {
      const data = await response.json();
      setDeploymentDetails(data);
    }
  };

  const getReplicaStatus = (available: number, desired: number) => {
    const status = `${available}/${desired}`;
    const isHealthy = desired > 0 && available === desired;
    const color = isHealthy ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white';
    return { status, color };
  };

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
                          const replica = getReplicaStatus(available, desired);

                          return (
                              <TableRow key={index} onClick={() => fetchDeploymentDetails(deployment)} className="cursor-pointer hover:bg-gray-100">
                                <TableCell className="font-medium">{deployment.name}</TableCell>
                                <TableCell>{deployment.namespace}</TableCell>
                                <TableCell>{desired}</TableCell>
                                <TableCell>{available}</TableCell>
                                <TableCell>{deployment.strategy || 'RollingUpdate'}</TableCell>
                                <TableCell>
                                  <Badge className={replica.color}>{replica.status}</Badge>
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

          {selectedDeployment && (
              <div className="fixed right-0 top-0 w-full max-w-xl h-full bg-white dark:bg-zinc-900 shadow-xl z-50 p-6 overflow-auto border-l border-zinc-200 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    Deployment: <span className="font-mono text-green-600">{selectedDeployment.name}</span>
                  </h2>
                  <Badge className={getReplicaStatus(
                      Number(selectedDeployment.availableReplicas || 0),
                      Number(selectedDeployment.replicas || 0)
                  ).color}>
                    {getReplicaStatus(
                        Number(selectedDeployment.availableReplicas || 0),
                        Number(selectedDeployment.replicas || 0)
                    ).status}
                  </Badge>
                  <button
                      onClick={() => {
                        setSelectedDeployment(null);
                        setDeploymentDetails(null);
                      }}
                      className="text-sm text-muted-foreground ml-4"
                  >
                    Close
                  </button>
                </div>

                <div className="mt-2">
                  <h3 className="font-bold mb-2">Full Deployment YAML</h3>
                  <pre className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap font-mono">
                {deploymentDetails ? JSON.stringify(deploymentDetails, null, 2) : 'Loading...'}
              </pre>
                </div>
              </div>
          )}
        </div>
      </Layout>
  );
};

export default Deployments;
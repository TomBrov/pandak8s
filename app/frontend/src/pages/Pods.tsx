import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { API_BASE_URL } from '../config';
import { formatAge, getPodStatusColor } from '@/utils/formatters';

const Pods = () => {
  const [namespace, setNamespace] = useState('all');

  const { data: podsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pods', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/pods?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch pods');
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
                <Package className="h-6 w-6 text-blue-500" />
                <h1 className="text-2xl font-bold text-gray-900">Pods</h1>
              </div>
              <p className="text-gray-600">
                {namespace === 'all'
                    ? 'View and manage Pods in All namespaces'
                    : <>View and manage Pods in the <span className="font-medium text-blue-600">{namespace}</span> namespace</>}
              </p>
              <p className="text-gray-600">

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
                <span>Pods in {namespace}</span>
                {isLoading && (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                )}
              </CardTitle>
              <NamespaceDropdown selectedNamespace={namespace} onNamespaceChange={setNamespace} />
            </CardHeader>
            <CardContent>
              {error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">⚠️ Failed to load pods</div>
                    <p className="text-gray-600">Unable to connect to the Kubernetes API</p>
                    <Button onClick={() => refetch()} className="mt-4" variant="outline">
                      Try Again
                    </Button>
                  </div>
              ) : podsData && podsData.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    ➤ No pods found in the selected namespace.
                  </div>
              ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Pod Name</TableHead>
                          <TableHead>Namespace</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Node</TableHead>
                          <TableHead>Restarts</TableHead>
                          <TableHead>Age</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                            Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                  {[...Array(6)].map((_, j) => (
                                      <TableCell key={j}>
                                        <div className="h-4 bg-gray-200 rounded animate-pulse" />
                                      </TableCell>
                                  ))}
                                </TableRow>
                            ))
                        ) : (
                            podsData.map((pod: any, index: number) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{pod.name}</TableCell>
                                  <TableCell>{pod.namespace}</TableCell>
                                  <TableCell>
                                    <Badge className={getPodStatusColor(pod.status)}>
                                      {pod.status || 'Unknown'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{pod.node || 'N/A'}</TableCell>
                                  <TableCell>{pod.restartCount || '0'}</TableCell>
                                  <TableCell>{formatAge(pod.creationTimestamp)}</TableCell>
                                </TableRow>
                            ))
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

export default Pods;
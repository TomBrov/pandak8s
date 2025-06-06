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
import yaml from 'js-yaml';

const Pods = () => {
  const [namespace, setNamespace] = useState('all');
  const [selectedPod, setSelectedPod] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');
  const [podYaml, setPodYaml] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);

  const { data: podsData, isLoading, error, refetch } = useQuery({
    queryKey: ['pods', namespace],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/pods?namespace=${namespace}`);
      if (!response.ok) throw new Error('Failed to fetch pods');
      return response.json();
    },
    refetchInterval: 30000,
  });

  const handleSelectPod = async (pod: any) => {
    setSelectedPod(pod);
    setLogs('');
    setPodYaml('');
    setLoadingLogs(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/pods/${pod.namespace}/${pod.name}`);
      const fullPod = await res.json();
      setPodYaml(yaml.dump(fullPod));
    } catch {
      setPodYaml('Failed to load full pod YAML.');
    }

    try {
      const logRes = await fetch(`${API_BASE_URL}/api/logs?podName=${pod.name}&namespace=${pod.namespace}`);
      const data = await logRes.json();
      setLogs(data.logs || 'No logs found.');
    } catch {
      setLogs('Failed to fetch logs.');
    }

    setLoadingLogs(false);
  };

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
            </div>
            <Button onClick={() => refetch()} disabled={isLoading} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="text-gray-800 dark:text-gray-100">
                  {namespace === 'all' ? ('Pods in All namespaces') : (<>Pods in <span className="font-medium">{namespace}</span></>)}
                </span>
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
                                <TableRow
                                    key={index}
                                    onClick={() => handleSelectPod(pod)}
                                    className="cursor-pointer hover:bg-muted"
                                >
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

        {selectedPod && (
            <div className="fixed right-0 top-0 w-full max-w-xl h-full bg-white dark:bg-zinc-900 shadow-xl z-50 p-6 overflow-auto border-l border-zinc-200 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Pod Name: <span className="font-mono text-blue-600">{selectedPod.name}</span>
                </h2>
                <Badge className={getPodStatusColor(selectedPod.status)}>
                  {selectedPod.status}
                </Badge>
                <button
                    onClick={() => {
                      setSelectedPod(null);
                      setLogs('');
                      setPodYaml('');
                    }}
                    className="text-sm text-muted-foreground ml-4"
                >
                  Close
                </button>
              </div>

              <div className="mt-2">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">Full Pod YAML</h3>
                  <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(podYaml)}
                  >
                    Copy YAML
                  </Button>
                </div>
                <pre className="bg-zinc-100 dark:bg-zinc-800 p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap font-mono">
              {podYaml}
            </pre>
              </div>

              <div className="mt-8">
                <h3 className="font-bold mb-2">Logs</h3>
                <div className="border rounded overflow-auto max-h-96 bg-zinc-100 dark:bg-zinc-800">
                  <table className="min-w-full text-sm font-mono">
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                    {[...logs.trim().split('\n')].reverse().map((line, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-2 text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap break-words">
                            {line}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                  {loadingLogs && (
                      <div className="text-center text-xs text-gray-400 p-2">Loading logs...</div>
                  )}
                </div>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default Pods;
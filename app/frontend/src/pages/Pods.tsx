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
  const [selectedPod, setSelectedPod] = useState<any>(null);
  const [logs, setLogs] = useState<string>('');
  const [metadataJson, setMetadataJson] = useState('');
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    setMetadataJson(JSON.stringify({
      labels: pod.labels || {},
      annotations: pod.annotations || {}
    }, null, 2));
    setLoadingLogs(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/logs?podName=${pod.name}&namespace=${pod.namespace}`);
      const data = await response.json();
      setLogs(data.logs || 'No logs found.');
    } catch {
      setLogs('Failed to fetch logs.');
    }
    setLoadingLogs(false);
  };

  const handleMetadataJsonSave = async () => {
    setIsSaving(true);
    try {
      const parsed = JSON.parse(metadataJson);
      const res = await fetch(`${API_BASE_URL}/api/pods/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          podName: selectedPod.name,
          namespace: selectedPod.namespace,
          metadata: parsed
        })
      });

      const result = await res.json();
      if (res.ok) {
        alert('Metadata updated!');
        refetch();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (err) {
      alert('Invalid JSON or update failed.');
    }
    setIsSaving(false);
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
                <h2 className="text-xl font-semibold">{selectedPod.name}</h2>
                <button
                    onClick={() => {
                      setSelectedPod(null);
                      setLogs('');
                      setMetadataJson('');
                    }}
                    className="text-sm text-muted-foreground"
                >
                  Close
                </button>
              </div>

              <div className="mb-6">
                <h3 className="font-bold mb-2">Edit Metadata (Raw JSON)</h3>
                <textarea
                    className="w-full h-64 p-3 rounded border font-mono text-sm bg-zinc-100 dark:bg-zinc-800 dark:text-white"
                    value={metadataJson}
                    onChange={(e) => setMetadataJson(e.target.value)}
                />
                <Button
                    className="mt-4"
                    onClick={handleMetadataJsonSave}
                    disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Metadata'}
                </Button>
              </div>

              <div className="mt-8">
                <h3 className="font-bold mb-2">Logs</h3>
                <pre className="bg-black text-green-400 p-3 rounded text-sm overflow-x-auto h-96">
              {loadingLogs ? 'Loading logs...' : logs}
            </pre>
              </div>
            </div>
        )}
      </Layout>
  );
};

export default Pods;

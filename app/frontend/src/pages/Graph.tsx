import React, { useEffect, useState } from 'react';
import ReactFlow, {
    MiniMap,
    Controls,
    Background,
    Edge,
    Node,
    useReactFlow,
} from 'react-flow-renderer';
import Layout from '@/components/Layout';
import NamespaceDropdown from '@/components/NamespaceDropdown';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { API_BASE_URL } from '../config';
import { Loader2 } from 'lucide-react';

const Graph = () => {
    const [namespace, setNamespace] = useState('all');
    const [graphData, setGraphData] = useState<{ nodes: Node[]; edges: Edge[] }>({
        nodes: [],
        edges: [],
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchGraph = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/graph?namespace=${namespace}`
                );
                const data = await response.json();

                const NAMESPACE_TYPES = ['Pod', 'Service', 'Deployment'];
                const namespaceGroups: Record<string, number> = {};
                let nsCount = 0;

                const nodes: Node[] = data.nodes
                    .filter((node: any) => NAMESPACE_TYPES.includes(node.type))
                    .map((node: any, idx: number) => {
                        const idParts = node.id.split('/');
                        const isAll = namespace === 'all';
                        const ns = isAll ? idParts[0] : namespace;
                        const name = isAll ? idParts[1] : node.id;

                        if (!(ns in namespaceGroups)) {
                            namespaceGroups[ns] = nsCount++;
                        }
                        const groupIndex = namespaceGroups[ns];

                        return {
                            id: node.id,
                            data: { label: `${node.type}: ${name}` },
                            position: {
                                x: 200 + (idx % 5) * 200 + groupIndex * 1000,
                                y: 100 + Math.floor(idx / 5) * 150,
                            },
                            style: {
                                border: '1px solid #555',
                                padding: 10,
                                borderRadius: 10,
                                background:
                                    node.type === 'Pod'
                                        ? '#f0f4ff'
                                        : node.type === 'Service'
                                            ? '#ffe8d6'
                                            : '#e0ffe0',
                            },
                        };
                    });

                const edges: Edge[] = data.edges.map((edge: any) => ({
                    id: `e-${edge.from}-${edge.to}`,
                    source: edge.from,
                    target: edge.to,
                    label: edge.relation,
                    animated: true,
                    style: { stroke: '#888' },
                }));

                setGraphData({ nodes, edges });
            } catch (err) {
                console.error('Failed to fetch graph data', err);
                setGraphData({ nodes: [], edges: [] });
            } finally {
                setIsLoading(false);
            }
        };

        fetchGraph();
    }, [namespace]);

    return (
        <Layout>
            <Card className="m-4">
                <CardHeader>
                    <CardTitle className="text-xl">
                        Cluster Graph View{' '}
                        {namespace !== 'all' ? `(${namespace})` : '(All Namespaces)'}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-4">
                        <NamespaceDropdown
                            selectedNamespace={namespace}
                            onNamespaceChange={setNamespace}
                        />
                    </div>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-[600px]">
                            <Loader2 className="animate-spin h-10 w-10 text-teal-500" />
                        </div>
                    ) : (
                        <div
                            style={{
                                height: '600px',
                                border: '1px solid #ccc',
                                borderRadius: '0.5rem',
                            }}
                        >
                            <ReactFlow
                                nodes={graphData.nodes}
                                edges={graphData.edges}
                                fitView
                                nodesDraggable={false}
                                nodesConnectable={false}
                                elementsSelectable={false}
                                zoomOnScroll={false}
                                panOnDrag={false}
                            >
                                <MiniMap />
                                <Controls />
                                <Background />
                            </ReactFlow>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Layout>
    );
};

export default Graph;
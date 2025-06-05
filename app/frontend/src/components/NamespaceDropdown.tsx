import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { API_BASE_URL } from '../config';

interface NamespaceDropdownProps {
    selectedNamespace: string;
    onNamespaceChange: (namespace: string) => void;
}

const NamespaceDropdown = ({ selectedNamespace, onNamespaceChange }: NamespaceDropdownProps) => {
    const { data: namespaces = [], isLoading } = useQuery({
        queryKey: ['namespaces'],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/api/namespaces`);
            if (!response.ok) throw new Error('Failed to fetch namespaces');
            return response.json();
        },
        refetchInterval: 30000,
    });

    return (
        <div className="flex items-center space-x-2 mb-4">
            <label htmlFor="namespace-select" className="text-sm font-medium">
                Namespace:
            </label>
            <Select
                value={selectedNamespace}
                onValueChange={onNamespaceChange}
                disabled={isLoading}
            >
                <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select namespace" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Namespaces</SelectItem>
                    {namespaces.map((name: string) => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

export default NamespaceDropdown;

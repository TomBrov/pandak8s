
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Package, Rocket, Settings, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  showNamespaceSelector?: boolean;
  onNamespaceChange?: (namespace: string) => void;
  currentNamespace?: string;
}

const Layout = ({ children, showNamespaceSelector, onNamespaceChange, currentNamespace }: LayoutProps) => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    { name: 'Overview', href: '/', icon: Home },
    { name: 'Pods', href: '/pods', icon: Package },
    { name: 'Deployments', href: '/deployments', icon: Rocket },
    { name: 'Services', href: '/services', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300 flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🐼</div>
            {!isCollapsed && (
              <span className="text-xl font-bold text-gray-900">PandaK8S</span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-teal-50 text-teal-700 border-r-2 border-teal-500"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon
                  className={cn(
                    "flex-shrink-0 h-5 w-5",
                    isActive ? "text-teal-500" : "text-gray-400 group-hover:text-gray-500",
                    isCollapsed ? "mr-0" : "mr-3"
                  )}
                />
                {!isCollapsed && item.name}
              </Link>
            );
          })}
        </nav>

        {/* Collapse button */}
        <div className="px-2 pb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full justify-center"
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">

        {/* Page content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;

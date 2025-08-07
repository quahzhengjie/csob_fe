// =================================================================================
// FILE: src/components/common/UserInfoPopover.tsx
// =================================================================================
'use client'

import React, { useState } from 'react';
import { User, ChevronDown, Shield, Check, X } from 'lucide-react';

interface UserInfoPopoverProps {
  currentUserRole: string;
  userRoles: Record<string, { label: string; permissions: Record<string, boolean> }>;
}

// Helper to format permission keys into readable labels
const formatPermissionLabel = (permission: string): string => {
  const labels: Record<string, string> = {
    'case:read': 'View Cases',
    'case:update': 'Update Cases',
    'case:approve': 'Approve Cases',
    'document:upload': 'Upload Documents',
    'document:read': 'View Documents',
    'document:verify': 'Verify Documents',
    'admin:manage-users': 'Manage Users',
    'admin:manage-templates': 'Manage Templates'
  };
  
  return labels[permission] || permission;
};

// Group permissions by category
const groupPermissions = (permissions: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {
    'Case Management': [],
    'Document Management': [],
    'Administration': []
  };
  
  permissions.forEach(perm => {
    if (perm.startsWith('case:')) {
      groups['Case Management'].push(perm);
    } else if (perm.startsWith('document:')) {
      groups['Document Management'].push(perm);
    } else if (perm.startsWith('admin:')) {
      groups['Administration'].push(perm);
    }
  });
  
  // Remove empty groups
  Object.keys(groups).forEach(key => {
    if (groups[key].length === 0) delete groups[key];
  });
  
  return groups;
};

export function UserInfoPopover({ currentUserRole, userRoles }: UserInfoPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const currentRole = userRoles[currentUserRole];
  if (!currentRole) return null;

  // Get all unique permissions across all roles
  const allPermissions = new Set<string>();
  Object.values(userRoles).forEach(role => {
    Object.keys(role.permissions).forEach(perm => allPermissions.add(perm));
  });

  const sortedPermissions = Array.from(allPermissions).sort();
  const groupedPermissions = groupPermissions(sortedPermissions);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <User size={16} />
        <span className="hidden sm:inline">{currentRole.label}</span>
        <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Popover */}
          <div className="absolute right-0 mt-2 w-96 max-w-[calc(100vw-2rem)] p-4 rounded-lg border bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg z-50">
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="font-semibold text-slate-900 dark:text-white">Current User Info</h3>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <X size={16} />
                </button>
              </div>

              {/* User Details */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Role:</span>
                  <span className="font-medium text-slate-900 dark:text-white">{currentRole.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Role Key:</span>
                  <code className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded font-mono">
                    {currentUserRole}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Username:</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">
                    {currentUserRole.replace('ROLE_', '').toLowerCase()}
                  </span>
                </div>
              </div>

              {/* Permissions - Grouped and Labeled */}
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300">Permissions:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3 p-2 bg-gray-50 dark:bg-slate-900/50 rounded-md">
                  {Object.entries(groupedPermissions).map(([category, perms]) => (
                    <div key={category} className="space-y-1">
                      <h5 className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                        {category}
                      </h5>
                      {perms.map(permission => {
                        const hasPermission = currentRole.permissions[permission] || false;
                        return (
                          <div 
                            key={permission} 
                            className="flex items-center justify-between py-1.5 px-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded"
                          >
                            <div className="flex-1">
                              <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {formatPermissionLabel(permission)}
                              </div>
                              <code className="text-xs text-slate-500 dark:text-slate-500">
                                {permission}
                              </code>
                            </div>
                            {hasPermission ? (
                              <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 ml-2" />
                            ) : (
                              <X className="h-4 w-4 text-red-600 dark:text-red-400 flex-shrink-0 ml-2" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              <div className="pt-3 border-t border-gray-200 dark:border-slate-700 grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {Object.values(currentRole.permissions).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Active Permissions
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-400 dark:text-slate-600">
                    {sortedPermissions.length - Object.values(currentRole.permissions).filter(Boolean).length}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Restricted
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <p>• Click the dropdown to switch roles</p>
                <p>• Role changes will reload the page</p>
                <p>• Default password: password123</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
// =================================================================================
// FILE: src/features/admin/components/RoleManagementTab.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, AlertCircle, Users } from 'lucide-react';
import type { Role } from '@/types/entities';
import { createRole, updateRoleLabel, deleteRole, getRoles } from '@/lib/apiClient';
import { CreateRoleModal } from './CreateRoleModal';
import { EditRoleModal } from './EditRoleModal';

interface RoleManagementTabProps {
  userRoles: Record<string, Role>;
  onRolesUpdate: (roles: Record<string, Role>) => void;
}

export function RoleManagementTab({ userRoles, onRolesUpdate }: RoleManagementTabProps) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<{ id: number; name: string; label: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateRole = async (roleData: { name: string; label: string; permissions: Record<string, boolean> }) => {
    setIsLoading(true);
    setError(null);
    
    try {
        await createRole(roleData);
      // Refresh all roles
      const allRoles = await getRoles();
      onRolesUpdate(allRoles);
      setIsCreateModalOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateRole = async (roleId: number, label: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await updateRoleLabel(roleId, { label });
      // Refresh all roles
      const allRoles = await getRoles();
      onRolesUpdate(allRoles);
      setIsEditModalOpen(false);
      setSelectedRole(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`)) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteRole(roleId);
      // Refresh all roles
      const allRoles = await getRoles();
      onRolesUpdate(allRoles);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete role');
    } finally {
      setIsLoading(false);
    }
  };

  // System roles that cannot be deleted
  const systemRoles = ['ROLE_ADMIN', 'ROLE_OPS_PROCESSOR', 'ROLE_OPS_USER', 'ROLE_OPS_MANAGER', 'ROLE_COMPLIANCE'];

  return (
    <>
      <CreateRoleModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateRole}
        existingRoles={Object.keys(userRoles)}
        allPermissions={getAllUniquePermissions(userRoles)}
        isLoading={isLoading}
      />
      
      {selectedRole && (
        <EditRoleModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedRole(null);
          }}
          onUpdate={(label) => handleUpdateRole(selectedRole.id, label)}
          role={selectedRole}
          isLoading={isLoading}
        />
      )}
      
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Role Management</h3>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
            <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Role Name</th>
                  <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Display Label</th>
                  <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Permissions</th>
                  <th className="p-4 text-left font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                {Object.entries(userRoles).map(([roleName, role]) => {
                  const isSystemRole = systemRoles.includes(roleName);
                  const permissionCount = Object.values(role.permissions).filter(Boolean).length;
                  
                  return (
                    <tr key={roleName} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="p-4">
                        <span className="font-mono text-sm text-gray-700 dark:text-gray-300">{roleName}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <Shield size={16} className="text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-900 dark:text-gray-100">{role.label}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          isSystemRole 
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                            : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {isSystemRole ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-gray-600 dark:text-gray-400">{permissionCount} permissions</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {role.id && (
                            <button
                              onClick={() => {
                                setSelectedRole({ id: role.id!, name: roleName, label: role.label });
                                setIsEditModalOpen(true);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline text-sm transition-colors"
                              disabled={isLoading}
                            >
                              <Edit2 size={14} className="inline mr-1" />
                              Edit
                            </button>
                          )}
                          {!isSystemRole && role.id && (
                            <>
                              <span className="text-gray-300 dark:text-slate-600">|</span>
                              <button
                                onClick={() => handleDeleteRole(role.id!, roleName)}
                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:underline text-sm transition-colors"
                                disabled={isLoading}
                              >
                                <Trash2 size={14} className="inline mr-1" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex items-start gap-3">
          <Users className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">About Roles</p>
            <p>
              System roles (marked in purple) cannot be deleted as they are core to the application.
              Custom roles can be created, edited, and deleted as needed. Configure permissions
              for any role in the Permissions tab.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Helper function to get all unique permissions
function getAllUniquePermissions(roles: Record<string, Role>): string[] {
  const permissions = new Set<string>();
  Object.values(roles).forEach(role => {
    Object.keys(role.permissions).forEach(perm => permissions.add(perm));
  });
  return Array.from(permissions).sort();
}
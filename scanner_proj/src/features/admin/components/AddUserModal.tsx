// =================================================================================
// FILE: src/features/admin/components/AddUserModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Role } from '@/types/enums';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newUserData: { name: string, email: string, role: string, department: string }) => void;
  userRoles: Record<string, Role>;
}

export function AddUserModal({ isOpen, onClose, onAdd, userRoles }: AddUserModalProps) {
    const [formData, setFormData] = useState({ name: '', email: '', role: 'Viewer', department: '' });

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) return;
        onAdd(formData);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">Add New User</h3><button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X size={16} /></button></div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div><label className="block text-sm font-medium mb-1">Full Name</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Department</label><input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" /></div>
                    <div><label className="block text-sm font-medium mb-1">Role</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600">{Object.entries(userRoles).map(([key, role]) => (<option key={key} value={key}>{role.label}</option>))}</select></div>
                    <div className="flex justify-end gap-4 pt-4"><button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-slate-600">Cancel</button><button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600">Add User</button></div>
                </form>
            </div>
        </div>
    );
}
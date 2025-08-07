// =================================================================================
// FILE: src/features/admin/components/AddUserModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { Role } from '@/types/entities';

export type NewUserData = {
  name: string;
  email: string;
  roleId: number;
  department: string;
  password: string;
};

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newUserData: NewUserData) => void;
  userRoles: Record<string, Role>;
  isLoading?: boolean;
}

export function AddUserModal({ isOpen, onClose, onAdd, userRoles, isLoading }: AddUserModalProps) {
    const [formData, setFormData] = useState<NewUserData>({ 
        name: '', 
        email: '', 
        password: '',
        roleId: Object.values(userRoles)[0]?.id || 0,
        department: '' 
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    if (!isOpen) return null;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters';
        }
        if (!formData.roleId) newErrors.roleId = 'Role is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        onAdd(formData);
    };

    const handleClose = () => {
        setFormData({ 
            name: '', email: '', password: '',
            roleId: Object.values(userRoles)[0]?.id || 0,
            department: '' 
        });
        setErrors({});
        onClose();
    };

    const baseInputClasses = "w-full px-3 py-2 border rounded-lg dark:bg-slate-700 transition-colors";
    const normalBorderClasses = "border-gray-300 dark:border-slate-600 focus:border-blue-500 dark:focus:border-blue-400";
    const errorBorderClasses = "border-red-500 dark:border-red-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
            <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Add New User</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" disabled={isLoading}>
                        <X size={16} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={`${baseInputClasses} ${errors.name ? errorBorderClasses : normalBorderClasses}`} placeholder="John Doe" disabled={isLoading} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></label>
                        <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className={`${baseInputClasses} ${errors.email ? errorBorderClasses : normalBorderClasses}`} placeholder="john.doe@company.com" disabled={isLoading} />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Password <span className="text-red-500">*</span></label>
                        <input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`${baseInputClasses} ${errors.password ? errorBorderClasses : normalBorderClasses}`} placeholder="Min. 8 characters" disabled={isLoading} />
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Department</label>
                        <input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className={`${baseInputClasses} ${normalBorderClasses}`} placeholder="Operations" disabled={isLoading} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></label>
                        <select value={formData.roleId} onChange={e => setFormData({...formData, roleId: Number(e.target.value)})} className={`${baseInputClasses} ${errors.roleId ? errorBorderClasses : normalBorderClasses}`} disabled={isLoading}>
                            {Object.values(userRoles).map((role) => (
                                <option key={role.id} value={role.id}>{role.label}</option>
                            ))}
                        </select>
                        {errors.roleId && <p className="mt-1 text-xs text-red-500">{errors.roleId}</p>}
                    </div>
                    
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={handleClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors disabled:opacity-50" disabled={isLoading}>Cancel</button>
                        <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2" disabled={isLoading}>
                            {isLoading && <Loader2 size={16} className="animate-spin" />}
                            Add User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
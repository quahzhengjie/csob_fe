// =================================================================================
// FILE: src/features/admin/components/EditUserModal.tsx
// =================================================================================
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { User, Role } from '@/types/entities';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (userId: string, userData: Partial<User> & { password?: string }) => void;
  user: User | null;
  userRoles: Record<string, Role>;
  isLoading?: boolean;
}

export function EditUserModal({ isOpen, onClose, onUpdate, user, userRoles, isLoading }: EditUserModalProps) {
    const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
        name: '',
        email: '',
        roleId: 0,
        department: '',
        password: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                roleId: user.roleId,
                department: user.department,
                password: '', // Always start with an empty password field
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name?.trim()) newErrors.name = 'Name is required';
        if (!formData.email?.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }
        if (formData.password && formData.password.length < 8) {
            newErrors.password = 'New password must be at least 8 characters';
        }
        if (!formData.roleId) newErrors.roleId = 'Role is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;
        
        const { name, email, roleId, department, password } = formData;
        const updatePayload: Partial<User> & { password?: string } = { name, email, roleId, department };

        if (password) {
            updatePayload.password = password;
        }

        onUpdate(user.userId, updatePayload);
    };

    const handleClose = () => {
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
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Edit User</h3>
                    <button onClick={handleClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700" disabled={isLoading}>
                        <X size={16} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Full Name <span className="text-red-500">*</span></label>
                        <input type="text" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={`${baseInputClasses} ${errors.name ? errorBorderClasses : normalBorderClasses}`} disabled={isLoading} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Email <span className="text-red-500">*</span></label>
                        <input type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} className={`${baseInputClasses} ${errors.email ? errorBorderClasses : normalBorderClasses}`} disabled={isLoading} />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Reset Password</label>
                        <input type="password" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} className={`${baseInputClasses} ${errors.password ? errorBorderClasses : normalBorderClasses}`} placeholder="Leave blank to keep current password" disabled={isLoading} />
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Department</label>
                        <input type="text" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} className={`${baseInputClasses} ${normalBorderClasses}`} disabled={isLoading} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 text-slate-700 dark:text-slate-300">Role <span className="text-red-500">*</span></label>
                        <select value={formData.roleId || ''} onChange={e => setFormData({...formData, roleId: Number(e.target.value)})} className={`${baseInputClasses} ${errors.roleId ? errorBorderClasses : normalBorderClasses}`} disabled={isLoading}>
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
                            Update User
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
// =================================================================================
// FILE: src/features/case/components/AssignCaseModal.tsx
// =================================================================================
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

// A simple type for our mock user, can be expanded later
interface User {
  userId: string;
  name: string;
}

interface AssignCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (userId: string, note: string) => void;
  users: User[];
  currentAssigneeId: string | null;
}

export function AssignCaseModal({ isOpen, onClose, onAssign, users, currentAssigneeId }: AssignCaseModalProps) {
  const [selectedUserId, setSelectedUserId] = useState(currentAssigneeId || users[0]?.userId || '');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
        alert('Please select a user to assign the case to.');
        return;
    }
    onAssign(selectedUserId, note);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className="p-8 rounded-xl border w-full max-w-md bg-white dark:bg-slate-800 dark:border-slate-700 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Assign Case</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="assignTo" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Assign To</label>
            <select
              id="assignTo"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            >
              <option value="" disabled>Select a user...</option>
              {users.map(user => (
                <option key={user.userId} value={user.userId}>{user.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="note" className="block text-sm font-medium mb-1 text-gray-700 dark:text-slate-300">Note (Optional)</label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600"
            />
          </div>

          <div className="flex justify-end gap-4 pt-4 mt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600">Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">Assign</button>
          </div>
        </form>
      </div>
    </div>
  );
}
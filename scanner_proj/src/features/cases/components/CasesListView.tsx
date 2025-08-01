// =================================================================================
// FILE: src/features/cases/components/CasesListView.tsx
// =================================================================================
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import type { Case, CaseCreationData } from '@/types/entities';
import { useEnumStore } from '@/features/enums/useEnumStore';
import Link from 'next/link';
import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { type RiskLevel, type CaseStatus } from '@/types/enums';
import { NewCaseModal } from './NewCaseModal';
// CORRECTED: Import the new, integrated 'createCase' function
import { createCase } from '@/lib/apiClient';

interface CasesListViewProps {
  cases: Case[];
}

const FilterButton = ({ label, onClick, isActive }: { label: string, onClick: () => void, isActive: boolean }) => (
    <button
        onClick={onClick}
        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            isActive
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
    >
        {label}
    </button>
);


export function CasesListView({ cases: initialCases }: CasesListViewProps) {
  const [caseList, setCaseList] = useState<Case[]>(initialCases);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{ riskLevel: RiskLevel[], status: CaseStatus[] }>({
    riskLevel: [],
    status: [],
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { riskLevel: riskLevelOptions, caseStatus: caseStatusOptions } = useEnumStore(s => s.enums);

  const handleFilterChange = (filterType: 'riskLevel' | 'status', value: RiskLevel | CaseStatus) => {
    setFilters(prev => {
      const currentFilter = prev[filterType] as (RiskLevel | CaseStatus)[];
      const newFilter = currentFilter.includes(value)
        ? currentFilter.filter(item => item !== value)
        : [...currentFilter, value];
      
      return { ...prev, [filterType]: newFilter };
    });
  };

  const handleCreateCase = async (data: CaseCreationData) => {
    // CORRECTED: Call the new 'createCase' function
    const newCase = await createCase(data);
    setCaseList(prevList => [newCase, ...prevList]);
    setIsModalOpen(false);
  };

  const filteredCases = useMemo(() => {
    return caseList.filter(c => {
      const riskMatch = filters.riskLevel.length === 0 || filters.riskLevel.includes(c.riskLevel);
      const statusMatch = filters.status.length === 0 || filters.status.includes(c.status);
      const searchMatch = searchTerm === '' || c.entity.entityName.toLowerCase().includes(searchTerm.toLowerCase()) || c.caseId.toLowerCase().includes(searchTerm.toLowerCase());
      
      return riskMatch && statusMatch && searchMatch;
    });
  }, [caseList, searchTerm, filters]);

  return (
    <>
      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCase}
      />

      <div className="space-y-6">
        <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Onboarding Cases</h1>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16}/> New Case
            </button>
          </div>

          <div className="space-y-4">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input type="text" placeholder="Search by name or case ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600" />
              </div>
              <div className="space-y-3 pt-2">
                  <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Risk Level</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                          <FilterButton label="All" onClick={() => setFilters(prev => ({...prev, riskLevel: []}))} isActive={filters.riskLevel.length === 0} />
                          {riskLevelOptions.map(level => (
                              <FilterButton key={level} label={level} onClick={() => handleFilterChange('riskLevel', level as RiskLevel)} isActive={filters.riskLevel.includes(level as RiskLevel)} />
                          ))}
                      </div>
                  </div>
                   <div>
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300">Status</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                          <FilterButton label="All" onClick={() => setFilters(prev => ({...prev, status: []}))} isActive={filters.status.length === 0} />
                          {caseStatusOptions.map(status => (
                              <FilterButton key={status} label={status} onClick={() => handleFilterChange('status', status as CaseStatus)} isActive={filters.status.includes(status as CaseStatus)} />
                          ))}
                      </div>
                  </div>
              </div>
          </div>
        </div>

        <div className="rounded-xl border overflow-hidden bg-white dark:bg-slate-800 dark:border-slate-700">
          <table className="w-full text-sm text-left">
            <thead className='bg-gray-50 dark:bg-slate-900'>
              <tr>
                <th className="p-4 font-semibold">Entity Name</th>
                <th className="p-4 font-semibold">Case ID</th>
                <th className="p-4 font-semibold">Risk Level</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCases.map(c => (
                <tr key={c.caseId} className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
                  <td className="p-4 font-medium">
                      <Link href={`/cases/${c.caseId}`} className="hover:underline text-blue-600 dark:text-blue-400">
                          {c.entity.entityName}
                      </Link>
                  </td>
                  <td className="p-4 text-slate-500">{c.caseId}</td>
                  <td className="p-4"><RiskBadge level={c.riskLevel} /></td>
                  <td className="p-4"><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
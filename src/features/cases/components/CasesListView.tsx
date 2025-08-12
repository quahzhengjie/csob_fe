// =================================================================================
// FILE: src/features/cases/components/CasesListView.tsx (FULLY ENHANCED)
// =================================================================================
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Plus, Search, ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, 
  ChevronLeft, ChevronRight, Inbox, Loader2, X, Download 
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Case, CaseCreationData, RiskLevel, CaseStatus } from '@/types/entities';
import { useEnumStore } from '@/features/enums/useEnumStore';
import Link from 'next/link';
import { RiskBadge } from '@/components/common/RiskBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { NewCaseModal } from './NewCaseModal';
import { createCase, searchCases } from '@/lib/apiClient';
import { WithPermission } from '@/features/rbac/WithPermission';
import { toast } from 'sonner'; // Make sure to install: npm install sonner

// --- Constants ---
const DEBOUNCE_DELAY = 350;
const PAGE_SIZE_OPTIONS = [10, 20, 50];

// --- Types ---
interface CasesPageResponse {
  data: Case[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface CaseFiltersState {
  riskLevel: RiskLevel[];
  status: CaseStatus[];
}

// --- Hooks ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// --- Utility Functions ---
const exportToCSV = (cases: Case[], filename: string = 'cases-export') => {
  const headers = ['Entity Name', 'Basic Number', 'Case ID', 'Risk Level', 'Status', 'Created Date'];
  
  const rows = cases.map(c => [
    c.entity.entityName,
    c.entity.basicNumber || 'N/A',
    c.caseId,
    c.riskLevel,
    c.status,
    new Date(c.createdDate).toLocaleDateString()
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Sub-components ---

const CasesListHeader = ({ 
  onNewCaseClick, 
  onExportClick 
}: { 
  onNewCaseClick: () => void;
  onExportClick: () => void;
}) => (
  <div className="flex justify-between items-center">
    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Onboarding Cases</h1>
    <div className="flex items-center gap-2">
      <button
        onClick={onExportClick}
        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
      >
        <Download size={16}/> Export CSV
      </button>
      <WithPermission permission="case:update">
        <button
          onClick={onNewCaseClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 transition-all"
        >
          <Plus size={16}/> New Case
        </button>
      </WithPermission>
    </div>
  </div>
);

const ActiveFilterBadges = ({ 
  filters, 
  onRemoveFilter 
}: { 
  filters: CaseFiltersState, 
  onRemoveFilter: (type: keyof CaseFiltersState, value: RiskLevel | CaseStatus) => void 
}) => {
  const allFilters = [
    ...filters.riskLevel.map(f => ({ type: 'riskLevel' as const, value: f })),
    ...filters.status.map(f => ({ type: 'status' as const, value: f }))
  ];

  if (allFilters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-slate-700">
      {allFilters.map((filter, index) => (
        <span
          key={`${filter.type}-${filter.value}-${index}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm"
        >
          <span className="capitalize">{filter.type === 'riskLevel' ? 'Risk' : 'Status'}:</span>
          <span className="font-medium">{filter.value}</span>
          <button
            onClick={() => onRemoveFilter(filter.type, filter.value as RiskLevel | CaseStatus)}
            aria-label={`Remove ${filter.value} filter`}
            className="ml-1 hover:bg-blue-200 dark:hover:bg-blue-800/50 rounded-full p-0.5 transition-colors"
          >
            <X size={12} />
          </button>
        </span>
      ))}
    </div>
  );
};

const CaseFilters = ({
  searchTerm,
  setSearchTerm,
  filters,
  handleFilterChange,
  resetFilters,
  activeFilterCount,
}: {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filters: CaseFiltersState;
  handleFilterChange: (filterType: keyof CaseFiltersState, value: RiskLevel | CaseStatus) => void;
  resetFilters: () => void;
  activeFilterCount: number;
}) => {
  const { riskLevel: riskLevelOptions, caseStatus: caseStatusOptions } = useEnumStore(s => s.enums);

  const FilterButton = ({ label, onClick, isActive }: { label: string, onClick: () => void, isActive: boolean }) => (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full border transition-colors duration-200 ${
        isActive
          ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
          : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="p-5 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1">
          <label htmlFor="search-cases" className="sr-only">Search Cases</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
            <input 
              id="search-cases"
              type="text" 
              placeholder="Name / Basic No. / CaseID" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-10 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
            {searchTerm.length > 0 && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 mr-2">Risk Level:</span>
            {riskLevelOptions.map(level => (
              <FilterButton 
                key={level} 
                label={level} 
                onClick={() => handleFilterChange('riskLevel', level as RiskLevel)} 
                isActive={filters.riskLevel.includes(level as RiskLevel)} 
              />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 mr-2">Status:</span>
            {caseStatusOptions.map(status => (
              <FilterButton 
                key={status} 
                label={status} 
                onClick={() => handleFilterChange('status', status as CaseStatus)} 
                isActive={filters.status.includes(status as CaseStatus)} 
              />
            ))}
          </div>
        </div>
      </div>
      
      <ActiveFilterBadges 
        filters={filters}
        onRemoveFilter={handleFilterChange}
      />
      
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={resetFilters}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            <X size={14} />
            Reset {activeFilterCount} Filter{activeFilterCount > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
};

const CaseRowSkeleton = () => (
    <tr className="animate-pulse">
        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div></td>
        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div></td>
        <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20"></div></td>
        <td className="p-4"><div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-24"></div></td>
        <td className="p-4"><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div></td>
    </tr>
);

const CasesTable = ({ 
  cases, 
  isLoading, 
  isRefetching, 
  sortBy, 
  sortOrder, 
  requestSort 
}: {
  cases: Case[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  requestSort: (key: string) => void;
}) => {
  const router = useRouter();

  const SortableHeader = ({ label, columnKey }: { label: string, columnKey: string }) => {
    const isSorted = sortBy === columnKey;
    const directionIcon = isSorted ? (sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />) : <div style={{width: 14}} />;
    
    return (
      <th className="p-4 font-semibold text-slate-600 dark:text-slate-300 text-left">
        <button 
          onClick={() => requestSort(columnKey)} 
          className={`flex items-center gap-1 transition-colors group ${
            isSorted 
              ? 'text-blue-600 dark:text-blue-400 font-bold' 
              : 'hover:text-blue-600 dark:hover:text-blue-400'
          }`}
        >
          {label} 
          <span className={`${isSorted ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`}>
            {directionIcon}
          </span>
        </button>
      </th>
    );
  };

  const handleRowClick = (caseId: string) => {
    router.push(`/cases/${caseId}`);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className='bg-gray-50 dark:bg-slate-900/50'>
            <tr>
              <SortableHeader label="Entity Name" columnKey="entityName" />
              <SortableHeader label="Basic Number" columnKey="basicNumber" />
              <SortableHeader label="Case ID" columnKey="caseId" />
              <SortableHeader label="Risk Level" columnKey="riskLevel" />
              <SortableHeader label="Status" columnKey="status" />
              <SortableHeader label="Created Date" columnKey="createdDate" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => <CaseRowSkeleton key={i} />)}
          </tbody>
        </table>
      </div>
    );
  }

  if (cases?.length === 0) {
    return (
      <div className="text-center p-12">
        <Inbox size={48} className="mx-auto text-slate-400" />
        <h3 className="mt-2 text-lg font-semibold text-slate-800 dark:text-slate-200">No Cases Found</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Try adjusting your search or filter criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {isRefetching && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 flex items-center justify-center z-10 rounded-xl">
           <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className='bg-gray-50 dark:bg-slate-900/50'>
            <tr>
              <SortableHeader label="Entity Name" columnKey="entityName" />
              <SortableHeader label="Basic Number" columnKey="basicNumber" />
              <SortableHeader label="Case ID" columnKey="caseId" />
              <SortableHeader label="Risk Level" columnKey="riskLevel" />
              <SortableHeader label="Status" columnKey="status" />
              <SortableHeader label="Created Date" columnKey="createdDate" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {cases?.map((c: Case) => (
              <tr
                key={c.caseId}
                onClick={() => handleRowClick(c.caseId)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleRowClick(c.caseId);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`View case ${c.caseId}`}
                className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer focus:outline-none focus:bg-blue-50 dark:focus:bg-slate-700"
              >
                <td className="p-4 font-medium text-blue-600 dark:text-blue-400">
                  {c.entity.entityName}
                </td>
                <td className="p-4 text-slate-600 dark:text-slate-400">
                  {c.entity.basicNumber ? (
                    <span className="font-mono text-sm">{c.entity.basicNumber}</span>
                  ) : (
                    <span className="text-slate-400 dark:text-slate-500 italic text-sm">N/A</span>
                  )}
                </td>
                <td className="p-4 text-slate-500 dark:text-slate-400 font-mono">{c.caseId}</td>
                <td className="p-4"><RiskBadge level={c.riskLevel} /></td>
                <td className="p-4"><StatusBadge status={c.status} /></td>
                <td className="p-4 text-slate-500 dark:text-slate-400">{new Date(c.createdDate).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CasesPagination = ({ 
  pagination, 
  onPageChange, 
  onLimitChange 
}: {
  pagination: CasesPageResponse['pagination'];
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}) => {
  if (!pagination || pagination.totalPages <= 0) return null;

  const { page, limit, total, totalPages } = pagination;
  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);
  
  const PageButton = ({ 
    onClick, 
    disabled, 
    children, 
    ariaLabel 
  }: React.PropsWithChildren<{
    onClick: () => void, 
    disabled: boolean, 
    ariaLabel: string
  }>) => (
      <button 
          onClick={onClick} 
          disabled={disabled} 
          aria-label={ariaLabel}
          className="p-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 enabled:hover:bg-gray-100 enabled:dark:hover:bg-slate-700 transition-colors"
      >
          {children}
      </button>
  );

  return (
    <div className="p-4 flex items-center justify-between flex-wrap gap-4 border-t dark:border-slate-700">
      <div className="text-sm text-slate-600 dark:text-slate-400">
        Showing <strong>{startItem}</strong>-<strong>{endItem}</strong> of <strong>{total}</strong>
      </div>
      <div className="flex items-center gap-2">
        <select 
          value={limit} 
          onChange={e => onLimitChange(Number(e.target.value))} 
          className="px-2 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {PAGE_SIZE_OPTIONS.map(size => <option key={size} value={size}>{size} per page</option>)}
        </select>
        <div className="flex items-center gap-1">
            <PageButton onClick={() => onPageChange(1)} disabled={page === 1} ariaLabel="First page">
              <ChevronsLeft size={16} />
            </PageButton>
            <PageButton onClick={() => onPageChange(page - 1)} disabled={page === 1} ariaLabel="Previous page">
              <ChevronLeft size={16} />
            </PageButton>
            <span 
              className="text-sm font-medium px-2 text-slate-700 dark:text-slate-300"
              aria-current="page"
              aria-label={`Page ${page} of ${totalPages}`}
            >
              {page} / {totalPages}
            </span>
            <PageButton onClick={() => onPageChange(page + 1)} disabled={page === totalPages} ariaLabel="Next page">
              <ChevronRight size={16} />
            </PageButton>
            <PageButton onClick={() => onPageChange(totalPages)} disabled={page === totalPages} ariaLabel="Last page">
              <ChevronsRight size={16} />
            </PageButton>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---

export function CasesListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [casesData, setCasesData] = useState<CasesPageResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from URL params
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<CaseFiltersState>({
    riskLevel: searchParams.get('risk')?.split(',').filter(Boolean) as RiskLevel[] || [],
    status: searchParams.get('status')?.split(',').filter(Boolean) as CaseStatus[] || [],
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc'
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get('page') || '1')
  );
  const [itemsPerPage, setItemsPerPage] = useState(PAGE_SIZE_OPTIONS[0]);

  const debouncedSearch = useDebounce(searchTerm, DEBOUNCE_DELAY);

  // Derived State
  const isInitialLoad = isLoading && !casesData;
  const isRefetching = isLoading && !!casesData;
  const activeFilterCount = useMemo(() => filters.riskLevel.length + filters.status.length, [filters]);

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('search', searchTerm);
    if (filters.riskLevel.length) params.set('risk', filters.riskLevel.join(','));
    if (filters.status.length) params.set('status', filters.status.join(','));
    if (sortBy !== 'createdDate') params.set('sortBy', sortBy);
    if (sortOrder !== 'desc') params.set('sortOrder', sortOrder);
    if (currentPage !== 1) params.set('page', currentPage.toString());
    
    const queryString = params.toString();
    router.push(`/cases${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [searchTerm, filters, sortBy, sortOrder, currentPage, router]);

  // Debounce URL updates
  useEffect(() => {
    const timer = setTimeout(updateURL, 300);
    return () => clearTimeout(timer);
  }, [updateURL]);

  // Data Fetching Effect
  useEffect(() => {
    const fetchCases = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await searchCases({
          page: currentPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          riskLevel: filters.riskLevel.length > 0 ? filters.riskLevel.join(',') : undefined,
          status: filters.status.length > 0 ? filters.status.join(',') : undefined,
          sortBy,
          sortOrder,
        });
        setCasesData(data);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError('Failed to load cases. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCases();
  }, [currentPage, itemsPerPage, debouncedSearch, filters, sortBy, sortOrder]);
  
  // Handlers
  const handleCreateCase = async (data: CaseCreationData): Promise<Case> => {
    try {
      const newCase = await createCase(data);
      setIsModalOpen(false);
      
      toast.success(
        <div className="flex items-center justify-between gap-4">
          <span>Case {newCase.caseId} created successfully!</span>
          <Link 
            href={`/cases/${newCase.caseId}`} 
            className="font-semibold text-blue-600 hover:text-blue-800 underline"
          >
            View Case →
          </Link>
        </div>,
        {
          duration: 5000,
        }
      );
      
      // Refresh list to show the new case
      setCurrentPage(1);
      setSortBy('createdDate');
      setSortOrder('desc');
      
      // Navigate to the new case after a short delay
      setTimeout(() => {
        router.push(`/cases/${newCase.caseId}`);
      }, 500);
      
      return newCase;
    } catch (error) {
      toast.error('Failed to create case. Please try again.');
      throw error;
    }
  };
  
  const handleFilterChange = useCallback((filterType: keyof CaseFiltersState, value: RiskLevel | CaseStatus) => {
    setFilters(prev => {
      const currentFilter = prev[filterType] as (RiskLevel | CaseStatus)[];
      const newFilter = currentFilter.includes(value)
        ? currentFilter.filter(item => item !== value)
        : [...currentFilter, value];
      return { ...prev, [filterType]: newFilter };
    });
    setCurrentPage(1);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };
  
  const resetFilters = useCallback(() => {
    setFilters({ riskLevel: [], status: [] });
    setCurrentPage(1);
  }, []);

  const requestSort = useCallback((key: string) => {
    setSortBy(key);
    setSortOrder(prevOrder => (sortBy === key && prevOrder === 'asc' ? 'desc' : 'asc'));
    setCurrentPage(1);
  }, [sortBy]);

  const handleLimitChange = (limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (casesData?.data) {
      exportToCSV(casesData.data, 'cases-export');
      toast.success('Cases exported successfully!');
    }
  };

  if (error && !casesData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <NewCaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateCase}
      />

      <div className="space-y-6">
        <CasesListHeader 
          onNewCaseClick={() => setIsModalOpen(true)} 
          onExportClick={handleExportCSV}
        />

        <CaseFilters 
          searchTerm={searchTerm}
          setSearchTerm={handleSearchChange}
          filters={filters}
          handleFilterChange={handleFilterChange}
          resetFilters={resetFilters}
          activeFilterCount={activeFilterCount}
        />

        <div className="rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
          <CasesTable 
            cases={casesData?.data}
            isLoading={isInitialLoad}
            isRefetching={isRefetching}
            sortBy={sortBy}
            sortOrder={sortOrder}
            requestSort={requestSort}
          />
          {casesData?.pagination && (
            <CasesPagination 
              pagination={casesData.pagination}
              onPageChange={setCurrentPage}
              onLimitChange={handleLimitChange}
            />
          )}
        </div>
      </div>
    </>
  );
}
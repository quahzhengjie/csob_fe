// =================================================================================
// FILE: src/features/dashboard/components/DashboardView.tsx
// =================================================================================
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import type { Case } from '@/types/entities';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  FileWarning
} from 'lucide-react';

interface DashboardViewProps {
  cases: Case[];
}

// Enhanced date formatting with more options
function formatDateAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  const minutes = Math.round(seconds / 60);
  const hours = Math.round(minutes / 60);
  const days = Math.round(hours / 24);

  if (seconds < 60) return `${seconds} sec ago`;
  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

// Calculate days until deadline
function daysUntilDeadline(deadline: string): number {
  const deadlineDate = new Date(deadline);
  const now = new Date();
  return Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// Get deadline status
function getDeadlineStatus(deadline: string): 'overdue' | 'urgent' | 'normal' {
  const days = daysUntilDeadline(deadline);
  if (days < 0) return 'overdue';
  if (days <= 2) return 'urgent';
  return 'normal';
}

export function DashboardView({ cases }: DashboardViewProps) {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');
  const [showAllActivity, setShowAllActivity] = useState(false);

  // Enhanced statistics with trends
  const stats = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
   
    const totalCases = cases.length;
    const inProgress = cases.filter(c => c.status === 'KYC Review').length;
    const pendingApproval = cases.filter(c => c.status === 'Pending Approval').length;
    const active = cases.filter(c => c.status === 'Active').length;
    const rejected = cases.filter(c => c.status === 'Rejected').length;
    const overdue = cases.filter(c => new Date(c.slaDeadline) < now).length;
    
    // Calculate weekly stats
    const casesThisWeek = cases.filter(c => new Date(c.createdDate) > weekAgo).length;
    const casesLastWeek = cases.filter(c => {
      const created = new Date(c.createdDate);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      return created > twoWeeksAgo && created <= weekAgo;
    }).length;
    
    const weeklyGrowth = casesLastWeek > 0 
      ? Math.round(((casesThisWeek - casesLastWeek) / casesLastWeek) * 100)
      : 100;
    
    // Calculate average processing time
    const completedCases = cases.filter(c => c.status === 'Active' || c.status === 'Rejected');
    const avgProcessingDays = completedCases.length > 0
      ? Math.round(
          completedCases.reduce((sum, c) => {
            const created = new Date(c.createdDate);
            const lastActivity = c.activities[c.activities.length - 1];
            const completed = lastActivity ? new Date(lastActivity.timestamp) : now;
            return sum + ((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
          }, 0) / completedCases.length
        )
      : 0;
    
    // Risk distribution
    const highRisk = cases.filter(c => c.riskLevel === 'High').length;
    const mediumRisk = cases.filter(c => c.riskLevel === 'Medium').length;
    const lowRisk = cases.filter(c => c.riskLevel === 'Low').length;
    
    return { 
      totalCases, 
      inProgress, 
      pendingApproval, 
      active, 
      rejected,
      overdue,
      casesThisWeek,
      weeklyGrowth,
      avgProcessingDays,
      highRisk,
      mediumRisk,
      lowRisk
    };
  }, [cases]);

  // Recent cases with enhanced sorting
  const recentCases = useMemo(() => {
    const sorted = [...cases]
      .sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
    return showAllActivity ? sorted : sorted.slice(0, 5);
  }, [cases, showAllActivity]);

  // Cases needing attention (overdue or about to be)
  const urgentCases = useMemo(() => {
    return cases
      .filter(c => {
        const status = getDeadlineStatus(c.slaDeadline);
        return (status === 'overdue' || status === 'urgent') && c.status !== 'Active' && c.status !== 'Rejected';
      })
      .sort((a, b) => daysUntilDeadline(a.slaDeadline) - daysUntilDeadline(b.slaDeadline))
      .slice(0, 5);
  }, [cases]);

  // Group cases by entity type
  const casesByEntityType = useMemo(() => {
    const grouped = cases.reduce((acc, c) => {
      const type = c.entity.entityType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Monitor KYC onboarding progress and key metrics
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeFilter === 'week' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeFilter === 'month' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setTimeFilter('quarter')}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              timeFilter === 'quarter' 
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200' 
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            Quarter
          </button>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <MetricCard 
          title="Total Cases" 
          value={stats.totalCases} 
          icon={Building2} 
          trend={`${stats.casesThisWeek} this week`}
          trendDirection={stats.weeklyGrowth > 0 ? 'up' : 'down'}
          trendValue={`${Math.abs(stats.weeklyGrowth)}%`}
        />
        <MetricCard 
          title="In Progress" 
          value={stats.inProgress} 
          icon={TrendingUp}
          subtitle={`${stats.pendingApproval} pending approval`}
        />
        <MetricCard 
          title="Active Accounts" 
          value={stats.active} 
          icon={CheckCircle}
          subtitle={`${stats.rejected} rejected`}
        />
        <MetricCard 
          title="Overdue Cases" 
          value={stats.overdue} 
          icon={AlertTriangle}
          variant={stats.overdue > 0 ? 'warning' : 'default'}
        />
        <MetricCard 
          title="Avg Processing" 
          value={`${stats.avgProcessingDays}d`} 
          icon={Clock}
          subtitle="days to complete"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity - Enhanced */}
        <div className="lg:col-span-2 p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Activity</h3>
            <Link 
              href="/cases" 
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="space-y-1">
            {recentCases.map(c => {
              const deadlineStatus = getDeadlineStatus(c.slaDeadline);
              const daysLeft = daysUntilDeadline(c.slaDeadline);
              
              return (
                <div 
                  key={c.caseId} 
                  className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-150 rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/cases/${c.caseId}`} 
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {c.entity.entityName}
                      </Link>
                      {c.riskLevel === 'High' && (
                        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full">
                          High Risk
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      {c.caseId} • {c.entity.entityType} • Created {formatDateAgo(c.createdDate)}
                    </p>
                    {c.status !== 'Active' && c.status !== 'Rejected' && (
                      <p className={`text-xs mt-1 ${
                        deadlineStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
                        deadlineStatus === 'urgent' ? 'text-amber-600 dark:text-amber-400' :
                        'text-slate-400 dark:text-slate-500'
                      }`}>
                        {deadlineStatus === 'overdue' 
                          ? `Overdue by ${Math.abs(daysLeft)} days` 
                          : `${daysLeft} days until deadline`}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    <ArrowUpRight size={16} className="text-slate-400" />
                  </div>
                </div>
              );
            })}
          </div>
          {!showAllActivity && cases.length > 5 && (
            <button
              onClick={() => setShowAllActivity(true)}
              className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              Show all {cases.length} cases
            </button>
          )}
        </div>

        {/* Right Column - Stats & Alerts */}
        <div className="space-y-6">
          {/* Risk Distribution */}
          <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Risk Distribution</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">High Risk</span>
                  <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.highRisk}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.highRisk / stats.totalCases) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Medium Risk</span>
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{stats.mediumRisk}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.mediumRisk / stats.totalCases) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Low Risk</span>
                  <span className="text-sm font-medium text-green-600 dark:text-green-400">{stats.lowRisk}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(stats.lowRisk / stats.totalCases) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Cases by Entity Type */}
          <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cases by Type</h3>
            <div className="space-y-2">
              {casesByEntityType.slice(0, 4).map(({ type, count }) => (
                <div key={type} className="flex justify-between items-center py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{type}</span>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Urgent Attention Required */}
          {urgentCases.length > 0 && (
            <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <FileWarning className="text-amber-600 dark:text-amber-400" size={20} />
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Needs Attention</h3>
              </div>
              <div className="space-y-2">
                {urgentCases.map(c => {
                  const daysLeft = daysUntilDeadline(c.slaDeadline);
                  return (
                    <Link
                      key={c.caseId}
                      href={`/cases/${c.caseId}`}
                      className="block text-sm hover:underline"
                    >
                      <span className="text-amber-800 dark:text-amber-300 font-medium">
                        {c.entity.entityName}
                      </span>
                      <span className="text-amber-600 dark:text-amber-400">
                        {' '}• {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
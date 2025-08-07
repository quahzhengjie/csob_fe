'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MetricCard } from '@/components/common/MetricCard';
import { StatusBadge } from '@/components/common/StatusBadge';
import { getDashboardStats, getDashboardActivity } from '@/lib/apiClient';
import { 
  Building2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  ArrowUpRight,
  ChevronRight,
  FileWarning,
  Loader2
} from 'lucide-react';

// Import the CaseStatus type from StatusBadge
type CaseStatus = 'KYC Review' | 'Pending Approval' | 'Active' | 'Rejected' | 'Prospect';

// API response types
interface DashboardStats {
  overview: {
    totalCases: number;
    inProgress: number;
    pendingApproval: number;
    active: number;
    rejected: number;
    overdue: number;
  };
  trends: {
    casesThisWeek: number;
    weeklyGrowth: number;
    avgProcessingDays: number;
  };
  riskDistribution: {
    high: number;
    medium: number;
    low: number;
  };
  entityTypeDistribution: Array<{
    type: string;
    count: number;
  }>;
}

interface DashboardActivity {
  recentCases: Array<{
    caseId: string;
    entityName: string;
    entityType: string;
    status: CaseStatus;
    riskLevel: string;
    createdDate: string;
    slaDeadline: string;
    daysUntilDeadline: number;
    deadlineStatus: 'OVERDUE' | 'URGENT' | 'NORMAL';
  }>;
  urgentCases: Array<{
    caseId: string;
    entityName: string;
    entityType: string;
    status: CaseStatus;
    riskLevel: string;
    createdDate: string;
    slaDeadline: string;
    daysUntilDeadline: number;
    deadlineStatus: 'OVERDUE' | 'URGENT' | 'NORMAL';
  }>;
}

// Format date for display
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

export function DashboardView() {
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter'>('week');
  const [showAllActivity, setShowAllActivity] = useState(false);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getDashboardStats(timeFilter);
        setStats(data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to load dashboard statistics');
      }
    };

    fetchStats();
  }, [timeFilter]);

  // Fetch dashboard activity
  useEffect(() => {
    const fetchActivity = async () => {
      setLoading(true);
      try {
        const limit = showAllActivity ? 50 : 5;
        const data = await getDashboardActivity(limit, true);
        setActivity(data);
      } catch (err) {
        console.error('Error fetching dashboard activity:', err);
        setError('Failed to load recent activity');
      } finally {
        setLoading(false);
      }
    };

    fetchActivity();
  }, [showAllActivity]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

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
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <MetricCard 
            title="Total Cases" 
            value={stats.overview.totalCases} 
            icon={Building2} 
            trend={`${stats.trends.casesThisWeek} this week`}
            trendDirection={stats.trends.weeklyGrowth > 0 ? 'up' : 'down'}
            trendValue={`${Math.abs(stats.trends.weeklyGrowth)}%`}
          />
          <MetricCard 
            title="In Progress" 
            value={stats.overview.inProgress} 
            icon={TrendingUp}
            subtitle={`${stats.overview.pendingApproval} pending approval`}
          />
          <MetricCard 
            title="Active Accounts" 
            value={stats.overview.active} 
            icon={CheckCircle}
            subtitle={`${stats.overview.rejected} rejected`}
          />
          <MetricCard 
            title="Overdue Cases" 
            value={stats.overview.overdue} 
            icon={AlertTriangle}
            variant={stats.overview.overdue > 0 ? 'warning' : 'default'}
          />
          <MetricCard 
            title="Avg Processing" 
            value={`${stats.trends.avgProcessingDays}d`} 
            icon={Clock}
            subtitle="days to complete"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
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
            {activity?.recentCases.map(c => (
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
                      {c.entityName}
                    </Link>
                    {c.riskLevel === 'High' && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200 rounded-full">
                        High Risk
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {c.caseId} • {c.entityType} • Created {formatDateAgo(c.createdDate)}
                  </p>
                  {c.status !== 'Active' && c.status !== 'Rejected' && (
                    <p className={`text-xs mt-1 ${
                      c.deadlineStatus === 'OVERDUE' ? 'text-red-600 dark:text-red-400' :
                      c.deadlineStatus === 'URGENT' ? 'text-amber-600 dark:text-amber-400' :
                      'text-slate-400 dark:text-slate-500'
                    }`}>
                      {c.deadlineStatus === 'OVERDUE' 
                        ? `Overdue by ${Math.abs(c.daysUntilDeadline)} days` 
                        : `${c.daysUntilDeadline} days until deadline`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <ArrowUpRight size={16} className="text-slate-400" />
                </div>
              </div>
            ))}
          </div>
          {!showAllActivity && activity && activity.recentCases.length >= 5 && (
            <button
              onClick={() => setShowAllActivity(true)}
              className="mt-4 w-full py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              ) : (
                'Show more activity'
              )}
            </button>
          )}
        </div>

        {/* Right Column - Stats & Alerts */}
        <div className="space-y-6">
          {/* Risk Distribution */}
          {stats && (
            <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Risk Distribution</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">High Risk</span>
                    <span className="text-sm font-medium text-red-600 dark:text-red-400">{stats.riskDistribution.high}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.riskDistribution.high / stats.overview.totalCases) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Medium Risk</span>
                    <span className="text-sm font-medium text-amber-600 dark:text-amber-400">{stats.riskDistribution.medium}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.riskDistribution.medium / stats.overview.totalCases) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Low Risk</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{stats.riskDistribution.low}</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(stats.riskDistribution.low / stats.overview.totalCases) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cases by Entity Type */}
          {stats && (
            <div className="p-6 rounded-xl border bg-white dark:bg-slate-800 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Cases by Type</h3>
              <div className="space-y-2">
                {stats.entityTypeDistribution.slice(0, 4).map(({ type, count }) => (
                  <div key={type} className="flex justify-between items-center py-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">{type}</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-white">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Urgent Attention Required */}
          {activity && activity.urgentCases.length > 0 && (
            <div className="p-6 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
              <div className="flex items-center gap-2 mb-3">
                <FileWarning className="text-amber-600 dark:text-amber-400" size={20} />
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Needs Attention</h3>
              </div>
              <div className="space-y-2">
                {activity.urgentCases.map(c => (
                  <Link
                    key={c.caseId}
                    href={`/cases/${c.caseId}`}
                    className="block text-sm hover:underline"
                  >
                    <span className="text-amber-800 dark:text-amber-300 font-medium">
                      {c.entityName}
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {' '}• {c.daysUntilDeadline < 0 ? `${Math.abs(c.daysUntilDeadline)} days overdue` : `${c.daysUntilDeadline} days left`}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
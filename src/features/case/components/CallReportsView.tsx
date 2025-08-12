// =================================================================================
// FILE: src/features/case/components/CallReportsView.tsx
// =================================================================================
'use client';

import React, { useState, useMemo } from 'react';
import { Plus, Phone, Calendar, Search, ChevronDown, ChevronUp, Clock, Edit, Trash2 } from 'lucide-react';
import { CallReportModal } from './CallReportModal';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import type { CallReport } from '@/types/entities';
import { WithPermission } from '@/features/rbac/WithPermission';

interface CallReportsViewProps {
  reports: CallReport[];
  onAddReport: (reportData: Omit<CallReport, 'reportId'>) => void;
  onUpdateReport?: (reportId: string, reportData: Omit<CallReport, 'reportId'>) => void;
  onDeleteReport?: (reportId: string, reason: string) => void;
}

export function CallReportsView({ reports, onAddReport, onUpdateReport, onDeleteReport }: CallReportsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<CallReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<CallReport | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReports, setExpandedReports] = useState<Set<string>>(new Set());

  // Search functionality
  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    
    const term = searchTerm.toLowerCase();
    return reports.filter(report => 
      report.summary.toLowerCase().includes(term) ||
      report.nextSteps?.toLowerCase().includes(term) ||
      report.attendees?.some(a => a.toLowerCase().includes(term))
    );
  }, [reports, searchTerm]);

  // Sort by date (newest first)
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => 
      new Date(b.callDate).getTime() - new Date(a.callDate).getTime()
    );
  }, [filteredReports]);

  const toggleReportExpansion = (reportId: string) => {
    setExpandedReports(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reportId)) {
        newSet.delete(reportId);
      } else {
        newSet.add(reportId);
      }
      return newSet;
    });
  };

  const handleAddReport = (reportData: Omit<CallReport, 'reportId'>) => {
    onAddReport(reportData);
    setIsModalOpen(false);
  };

  const handleEditReport = (report: CallReport) => {
    setEditingReport(report);
    setIsModalOpen(true);
  };

  const handleUpdateReport = (reportData: Omit<CallReport, 'reportId'>) => {
    if (editingReport && onUpdateReport) {
      onUpdateReport(editingReport.reportId, reportData);
      setEditingReport(null);
      setIsModalOpen(false);
    }
  };

  const handleDelete = (reason: string) => {
    if (deletingReport && onDeleteReport) {
      onDeleteReport(deletingReport.reportId, reason);
      setDeletingReport(null);
    }
  };

  const getCallTypeIcon = (type?: string) => {
    switch (type) {
      case 'Inbound': return '📞';
      case 'Outbound': return '☎️';
      case 'Meeting': return '👥';
      case 'Email': return '📧';
      default: return '📞';
    }
  };

  const getOutcomeStyle = (outcome?: string) => {
    switch (outcome) {
      case 'Positive': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Negative': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'Follow-up Required': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Check if today
    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Check if yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    });
  };

  return (
    <>
      <CallReportModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingReport(null);
        }}
        onSave={editingReport ? handleUpdateReport : handleAddReport}
        initialData={editingReport}
      />

      <DeleteConfirmationModal
        isOpen={!!deletingReport}
        onClose={() => setDeletingReport(null)}
        onConfirm={handleDelete}
        title="Delete Call Report"
        message={`Are you sure you want to delete the call report from ${deletingReport ? formatDate(deletingReport.callDate) : ''}? This action cannot be undone.`}
        requireReason={true}
        reasonPlaceholder="Please provide a reason for deleting this report..."
      />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Call Reports
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({reports.length} total)
            </span>
          </h3>
          <WithPermission permission="case:update">
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus size={16}/> Add Report
            </button>
          </WithPermission>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm dark:bg-slate-700 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Reports List */}
        <div className="space-y-3">
          {sortedReports.length > 0 ? (
            sortedReports.map(report => {
              const isExpanded = expandedReports.has(report.reportId);
              
              return (
                <div 
                  key={report.reportId} 
                  className="rounded-lg border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 overflow-hidden transition-all"
                >
                  {/* Report Header - Always visible */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div 
                        className="flex-1 cursor-pointer"
                        onClick={() => toggleReportExpansion(report.reportId)}
                      >
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {/* Call Type */}
                          <span className="text-lg" title={report.callType || 'Call'}>
                            {getCallTypeIcon(report.callType)}
                          </span>
                          
                          {/* Type Label */}
                          {report.callType && (
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {report.callType}
                            </span>
                          )}
                          
                          {/* Date */}
                          <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatDate(report.callDate)}
                          </div>

                          {/* Duration */}
                          {report.duration && (
                            <div className="flex items-center gap-1 text-sm text-slate-500">
                              <Clock className="h-3.5 w-3.5" />
                              {report.duration} min
                            </div>
                          )}

                          {/* Outcome */}
                          {report.outcome && (
                            <span className={`px-2 py-0.5 text-xs rounded-full ${getOutcomeStyle(report.outcome)}`}>
                              {report.outcome}
                            </span>
                          )}
                        </div>

                        {/* Summary Preview */}
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">
                          {report.summary}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 ml-4">
                        <WithPermission permission="case:update">
                          <div className="flex items-center gap-1">
                            {onUpdateReport && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditReport(report);
                                }}
                                className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Edit report"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                            )}
                            {onDeleteReport && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingReport(report);
                                }}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete report"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </WithPermission>
                        
                        {/* Expand/Collapse Icon */}
                        <button
                          onClick={() => toggleReportExpansion(report.reportId)}
                          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {isExpanded ? 
                            <ChevronUp className="h-5 w-5" /> : 
                            <ChevronDown className="h-5 w-5" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-gray-100 dark:border-slate-700">
                      <div className="mt-3 space-y-4">
                        {/* Full Summary */}
                        <div>
                          <h5 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                            Summary
                          </h5>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {report.summary}
                          </p>
                        </div>

                        {/* Next Steps */}
                        {report.nextSteps && (
                          <div>
                            <h5 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Next Steps
                            </h5>
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                              {report.nextSteps}
                            </p>
                          </div>
                        )}

                        {/* Attendees */}
                        {report.attendees && report.attendees.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 uppercase tracking-wider">
                              Attendees
                            </h5>
                            <div className="flex flex-wrap gap-1.5">
                              {report.attendees.map((attendee, idx) => (
                                <span 
                                  key={idx}
                                  className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded"
                                >
                                  {attendee}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-gray-100 dark:border-slate-700">
                          <span>Report ID: {report.reportId}</span>
                          {report.createdBy && (
                            <span>Created by: {report.createdBy}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500">
                {searchTerm ? 'No reports match your search' : 'No call reports have been logged for this case.'}
              </p>
              {!searchTerm && (
                <WithPermission permission="case:update">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Add your first report
                  </button>
                </WithPermission>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
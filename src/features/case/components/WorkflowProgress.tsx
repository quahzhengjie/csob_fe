import React from 'react';
import { CheckCircle, Search, FileText, UserCheck, ThumbsUp } from 'lucide-react';

interface WorkflowStage {
    id: string;
    label: string;
    icon: React.ElementType;
}

const stages: WorkflowStage[] = [
    { id: 'prospect', label: 'Prospect', icon: Search },
    { id: 'document_collection', label: 'Doc Collection', icon: FileText },
    { id: 'kyc_review', label: 'KYC Review', icon: UserCheck },
    { id: 'approval', label: 'Approval', icon: ThumbsUp },
    { id: 'completed', label: 'Completed', icon: CheckCircle },
];

// Map the actual workflowStage values from your data to the display stages
const stageMapping: Record<string, string> = {
    'initiation': 'prospect',
    'prospect': 'prospect',
    'document_collection': 'document_collection',
    'kyc_review': 'kyc_review',
    'pending_approval': 'approval',
    'approval': 'approval',
    'completed': 'completed',
    'active': 'completed',
};

interface WorkflowProgressProps {
    currentStageId: string;
}

export function WorkflowProgress({ currentStageId }: WorkflowProgressProps) {
    // Map the actual stage ID to our display stage
    const mappedStageId = stageMapping[currentStageId] || currentStageId;
    const currentIndex = stages.findIndex(s => s.id === mappedStageId);

    return (
        <div className="w-full">
            <div className="flex items-center">
                {stages.map((stage, index) => {
                    const isCompleted = index < currentIndex;
                    const isCurrent = index === currentIndex;
                    const Icon = stage.icon;

                    return (
                        <React.Fragment key={stage.id}>
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                                    ${isCompleted ? 'bg-green-500 border-green-500 text-white' : ''}
                                    ${isCurrent ? 'bg-blue-600 border-blue-600 text-white' : ''}
                                    ${!isCompleted && !isCurrent ? 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-slate-400' : ''}
                                `}>
                                    {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                                </div>
                                <p className={`text-xs mt-2 font-medium ${isCurrent ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                    {stage.label}
                                </p>
                            </div>
                            {index < stages.length - 1 && (
                                <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${isCompleted ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`} />
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
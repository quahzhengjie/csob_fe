// =================================================================================
// FILE: src/features/case/components/NotificationComponents.tsx
// =================================================================================
import React, { useEffect, useState } from 'react';
import { Check, X, AlertCircle, Info } from 'lucide-react';

// Toast Notification Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

// Toast Container Component
export const ToastContainer: React.FC<{ 
  notifications: ToastNotification[];
  onRemove: (id: string) => void;
}> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {notifications.map((notification) => (
        <Toast 
          key={notification.id} 
          notification={notification} 
          onClose={() => onRemove(notification.id)}
        />
      ))}
    </div>
  );
};

// Individual Toast Component
const Toast: React.FC<{ 
  notification: ToastNotification;
  onClose: () => void;
}> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose();
      }, notification.duration || 5000);
      
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const icons = {
    success: <Check className="w-5 h-5" />,
    error: <X className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
  };

  const iconColors = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400'
  };

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-lg border shadow-lg
        ${colors[notification.type]}
        animate-slide-in-right
      `}
    >
      <div className={`flex-shrink-0 ${iconColors[notification.type]}`}>
        {icons[notification.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{notification.title}</p>
        {notification.message && (
          <p className="text-sm mt-1 opacity-90">{notification.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 ml-2 text-current opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Confirmation Modal Component
interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  details?: string[];
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
  icon?: React.ReactNode;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  details,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  icon
}) => {
  if (!isOpen) return null;

  const buttonColors = {
    info: 'bg-blue-600 hover:bg-blue-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    danger: 'bg-red-600 hover:bg-red-700'
  };

  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    danger: 'text-red-600 dark:text-red-400'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            {icon && (
              <div className={`flex-shrink-0 ${iconColors[type]}`}>
                {icon}
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {title}
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {message}
              </p>
              {details && details.length > 0 && (
                <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                    {details.map((detail, index) => (
                      <li key={index} className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${buttonColors[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// Result Summary Modal for downloads
interface DownloadSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  successCount: number;
  totalCount: number;
  failures?: string[];
  isZip?: boolean;
}

export const DownloadSummaryModal: React.FC<DownloadSummaryModalProps> = ({
  isOpen,
  onClose,
  successCount,
  totalCount,
  failures = [],
  isZip = false
}) => {
  if (!isOpen) return null;

  const isComplete = successCount === totalCount;
  const isPartial = successCount > 0 && successCount < totalCount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 ${isComplete ? 'text-green-600' : isPartial ? 'text-yellow-600' : 'text-red-600'}`}>
              {isComplete ? (
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {isComplete ? 'Download Complete!' : isPartial ? 'Partial Download' : 'Download Failed'}
              </h3>
              
              <div className="space-y-2">
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {isZip ? (
                    <>Successfully downloaded {successCount} of {totalCount} documents as ZIP file.</>
                  ) : (
                    <>Successfully downloaded {successCount} of {totalCount} documents.</>
                  )}
                </p>
                
                {isZip && isComplete && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    The ZIP file contains folders organized by document category.
                  </p>
                )}
                
                {failures.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">
                      Failed downloads ({failures.length}):
                    </p>
                    <div className="max-h-32 overflow-y-auto p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <ul className="text-xs text-red-700 dark:text-red-300 space-y-1">
                        {failures.slice(0, 10).map((failure, index) => (
                          <li key={index}>• {failure}</li>
                        ))}
                        {failures.length > 10 && (
                          <li className="font-medium mt-2">... and {failures.length - 10} more</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

// Hook to manage notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);

  const showNotification = (
    type: ToastType,
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Date.now().toString();
    const notification: ToastNotification = {
      id,
      type,
      title,
      message,
      duration
    };
    
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return {
    notifications,
    showNotification,
    removeNotification,
    showSuccess: (title: string, message?: string) => showNotification('success', title, message),
    showError: (title: string, message?: string) => showNotification('error', title, message),
    showWarning: (title: string, message?: string) => showNotification('warning', title, message),
    showInfo: (title: string, message?: string) => showNotification('info', title, message),
  };
};

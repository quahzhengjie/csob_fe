// =================================================================================
// FILE: src/lib/dateUtils.ts - New utility file for date handling
// =================================================================================
'use client';

/**
 * Utility functions for handling dates and timezones
 */

// Get user's timezone (defaults to Singapore if not available)
export const getUserTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'Asia/Singapore';
  }
};

// Format UTC date string to user's local timezone
export const formatLocalDateTime = (
  utcDateString: string, 
  options?: Intl.DateTimeFormatOptions
): string => {
  const date = new Date(utcDateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: getUserTimezone()
  };
  
  return date.toLocaleString('en-SG', { ...defaultOptions, ...options });
};

// Format date for display in forms (YYYY-MM-DD)
export const formatDateForInput = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  // Convert to local date in user's timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Format time for display in forms (HH:MM)
export const formatTimeForInput = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

// Convert local date and time inputs to UTC ISO string
export const combineDateTime = (dateInput: string, timeInput: string): string => {
  // dateInput: "2024-01-15", timeInput: "14:30"
  const [year, month, day] = dateInput.split('-').map(Number);
  const [hours, minutes] = timeInput.split(':').map(Number);
  
  // Create date in user's local timezone
  const localDate = new Date(year, month - 1, day, hours, minutes);
  
  // Convert to UTC ISO string
  return localDate.toISOString();
};

// Check if a date is today in user's timezone
export const isToday = (utcDateString: string): boolean => {
  const date = new Date(utcDateString);
  const today = new Date();
  
  // Compare dates in user's timezone
  const dateLocal = date.toLocaleDateString('en-US', { timeZone: getUserTimezone() });
  const todayLocal = today.toLocaleDateString('en-US', { timeZone: getUserTimezone() });
  
  return dateLocal === todayLocal;
};

// Get relative time (e.g., "2 hours ago")
export const getRelativeTime = (utcDateString: string): string => {
  const date = new Date(utcDateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  
  return formatLocalDateTime(utcDateString, { dateStyle: 'short', timeStyle: undefined });
};
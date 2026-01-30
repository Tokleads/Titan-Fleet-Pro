/**
 * Countdown Timer Utilities
 * 
 * Calculate days until due dates and determine urgency levels
 * for MOT, Tax, and Service due dates.
 */

export interface CountdownResult {
  daysUntil: number;
  isOverdue: boolean;
  urgency: 'safe' | 'warning' | 'danger';
  displayText: string;
  colorClass: string;
}

/**
 * Calculate days until a due date
 * @param dueDate - The due date (string or Date)
 * @returns Number of days (negative if overdue)
 */
export function calculateDaysUntil(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null;
  
  const due = new Date(dueDate);
  const today = new Date();
  
  // Reset time to midnight for accurate day calculation
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Get countdown result with urgency level and styling
 * @param dueDate - The due date
 * @param warningThreshold - Days before due to show warning (default: 30)
 * @param dangerThreshold - Days before due to show danger (default: 7)
 * @returns CountdownResult object
 */
export function getCountdown(
  dueDate: string | Date | null | undefined,
  warningThreshold: number = 30,
  dangerThreshold: number = 7
): CountdownResult | null {
  const daysUntil = calculateDaysUntil(dueDate);
  
  if (daysUntil === null) return null;
  
  const isOverdue = daysUntil < 0;
  const absDays = Math.abs(daysUntil);
  
  // Determine urgency level
  let urgency: 'safe' | 'warning' | 'danger';
  let colorClass: string;
  
  if (isOverdue) {
    urgency = 'danger';
    colorClass = 'text-red-600 bg-red-50 border-red-200';
  } else if (daysUntil <= dangerThreshold) {
    urgency = 'danger';
    colorClass = 'text-red-600 bg-red-50 border-red-200';
  } else if (daysUntil <= warningThreshold) {
    urgency = 'warning';
    colorClass = 'text-amber-600 bg-amber-50 border-amber-200';
  } else {
    urgency = 'safe';
    colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  }
  
  // Generate display text
  let displayText: string;
  if (isOverdue) {
    if (absDays === 0) {
      displayText = 'Due today';
    } else if (absDays === 1) {
      displayText = 'Overdue by 1 day';
    } else {
      displayText = `Overdue by ${absDays} days`;
    }
  } else {
    if (daysUntil === 0) {
      displayText = 'Due today';
    } else if (daysUntil === 1) {
      displayText = '1 day remaining';
    } else {
      displayText = `${daysUntil} days remaining`;
    }
  }
  
  return {
    daysUntil,
    isOverdue,
    urgency,
    displayText,
    colorClass
  };
}

/**
 * Get MOT countdown with specific thresholds
 * MOT: Warning at 30 days, Danger at 14 days
 */
export function getMOTCountdown(motDue: string | Date | null | undefined): CountdownResult | null {
  return getCountdown(motDue, 30, 14);
}

/**
 * Get Tax countdown with specific thresholds
 * Tax: Warning at 30 days, Danger at 7 days
 */
export function getTaxCountdown(taxDue: string | Date | null | undefined): CountdownResult | null {
  return getCountdown(taxDue, 30, 7);
}

/**
 * Get Service countdown with specific thresholds
 * Service: Warning at 30 days, Danger at 7 days
 */
export function getServiceCountdown(serviceDue: string | Date | null | undefined): CountdownResult | null {
  return getCountdown(serviceDue, 30, 7);
}

/**
 * Format date for display
 * @param date - Date to format
 * @returns Formatted date string (e.g., "15 Jan 2025")
 */
export function formatDueDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  
  const d = new Date(date);
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Get urgency icon name based on countdown
 */
export function getUrgencyIcon(countdown: CountdownResult | null): string {
  if (!countdown) return 'Calendar';
  
  switch (countdown.urgency) {
    case 'danger':
      return 'AlertTriangle';
    case 'warning':
      return 'Clock';
    case 'safe':
      return 'CheckCircle2';
    default:
      return 'Calendar';
  }
}

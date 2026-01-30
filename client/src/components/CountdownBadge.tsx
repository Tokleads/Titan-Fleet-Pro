import { Calendar, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getCountdown, formatDueDate, type CountdownResult } from "@/lib/countdown";

interface CountdownBadgeProps {
  label: string;
  dueDate: string | Date | null | undefined;
  warningThreshold?: number;
  dangerThreshold?: number;
  compact?: boolean;
}

export function CountdownBadge({ 
  label, 
  dueDate, 
  warningThreshold = 30,
  dangerThreshold = 7,
  compact = false
}: CountdownBadgeProps) {
  const countdown = getCountdown(dueDate, warningThreshold, dangerThreshold);
  
  if (!countdown) return null;
  
  const Icon = countdown.urgency === 'danger' ? AlertTriangle :
               countdown.urgency === 'warning' ? Clock :
               CheckCircle2;
  
  if (compact) {
    // Compact version for vehicle cards
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border ${countdown.colorClass}`}>
        <Icon className="h-3 w-3" />
        <span>{label}: {countdown.daysUntil >= 0 ? countdown.daysUntil : 'Overdue'}</span>
      </div>
    );
  }
  
  // Full version with details
  return (
    <div className={`flex items-start gap-2 p-3 rounded-lg border ${countdown.colorClass}`}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold">{label}</p>
          {dueDate && (
            <p className="text-xs opacity-75">{formatDueDate(dueDate)}</p>
          )}
        </div>
        <p className="text-xs mt-0.5">{countdown.displayText}</p>
      </div>
    </div>
  );
}

interface MultiCountdownBadgeProps {
  motDue?: string | Date | null;
  taxDue?: string | Date | null;
  serviceDue?: string | Date | null;
}

/**
 * Display multiple countdown badges in a compact row
 * Used on vehicle cards to show MOT, Tax, and Service countdowns
 */
export function MultiCountdownBadge({ motDue, taxDue, serviceDue }: MultiCountdownBadgeProps) {
  const motCountdown = motDue ? getCountdown(motDue, 30, 14) : null;
  const taxCountdown = taxDue ? getCountdown(taxDue, 30, 7) : null;
  const serviceCountdown = serviceDue ? getCountdown(serviceDue, 30, 7) : null;
  
  const hasAny = motCountdown || taxCountdown || serviceCountdown;
  
  if (!hasAny) return null;
  
  return (
    <div className="flex flex-wrap gap-2">
      {motCountdown && (
        <CountdownBadge 
          label="MOT" 
          dueDate={motDue} 
          warningThreshold={30}
          dangerThreshold={14}
          compact 
        />
      )}
      {taxCountdown && (
        <CountdownBadge 
          label="Tax" 
          dueDate={taxDue} 
          warningThreshold={30}
          dangerThreshold={7}
          compact 
        />
      )}
      {serviceCountdown && (
        <CountdownBadge 
          label="Service" 
          dueDate={serviceDue} 
          warningThreshold={30}
          dangerThreshold={7}
          compact 
        />
      )}
    </div>
  );
}

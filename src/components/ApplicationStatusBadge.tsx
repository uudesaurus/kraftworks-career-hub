import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  submitted: { label: '📩 Submitted', variant: 'secondary' },
  reviewed: { label: '👀 Reviewed', variant: 'outline' },
  shortlisted: { label: '⭐ Shortlisted', variant: 'default', className: 'bg-blue-600 hover:bg-blue-700' },
  interview: { label: '🗓 Interview', variant: 'default', className: 'bg-cyan-600 hover:bg-cyan-700' },
  offered: { label: '🎁 Offered', variant: 'default', className: 'bg-purple-600 hover:bg-purple-700' },
  hired: { label: '🎉 Hired', variant: 'default', className: 'bg-green-600 hover:bg-green-700' },
  rejected: { label: 'Not Selected', variant: 'destructive' },
  withdrawn: { label: 'Withdrawn', variant: 'outline' },
};

export function ApplicationStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, variant: 'outline' as const };
  return (
    <Badge variant={config.variant} className={config.className || ''}>
      {config.label}
    </Badge>
  );
}

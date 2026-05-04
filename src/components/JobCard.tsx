import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CompanyBadge } from '@/components/CompanyBadge';
import { MapPin, Clock, DollarSign, Star, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobCardProps {
  job: {
    id: string;
    title: string;
    trade_category: string;
    employment_type: string;
    city: string;
    state: string;
    salary_min?: number | null;
    salary_max?: number | null;
    salary_period?: string | null;
    is_featured?: number;
    is_remote?: number;
    created_at: string;
    company_name?: string;
    company_logo_url?: string | null;
    is_partner?: number;
    is_verified?: number;
  };
  applied?: boolean;
}

const tradeLabels: Record<string, string> = {
  electrician: 'Electrician',
  hvac: 'HVAC',
  welding: 'Welding',
  plumbing: 'Plumbing',
  carpentry: 'Carpentry',
  general: 'General',
};

const typeLabels: Record<string, string> = {
  full_time: 'Full Time',
  part_time: 'Part Time',
  contract: 'Contract',
  apprenticeship: 'Apprenticeship',
};

function formatSalary(min?: number | null, max?: number | null, period?: string | null) {
  if (!min && !max) return null;
  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`;
  const periodLabel = period ? `/${period.replace('ly', '')}` : '';
  if (min && max) return `${fmt(min)} - ${fmt(max)}${periodLabel}`;
  if (min) return `From ${fmt(min)}${periodLabel}`;
  return `Up to ${fmt(max!)}${periodLabel}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function JobCard({ job, applied }: JobCardProps) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_period);

  return (
    <Link to={`/career-fair/jobs/${job.id}`}>
      <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
        job.is_featured ? 'border-amber-400 bg-amber-50/30' : ''
      } ${applied ? 'ring-1 ring-green-300 bg-green-50/30 dark:bg-green-950/10' : ''}`}>
        <CardContent className="p-4 sm:p-5">
          {applied && (
            <div className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 font-medium mb-2">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Applied
            </div>
          )}
          <div className="flex items-start gap-3">
            {job.company_logo_url ? (
              <img
                src={job.company_logo_url}
                alt={job.company_name || ''}
                className="h-10 w-10 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-sm font-bold text-primary">
                {(job.company_name || 'C')[0].toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{job.title}</h3>
                {!!job.is_featured && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-400 text-amber-700 gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400" />
                    Featured
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-sm text-muted-foreground">{job.company_name}</span>
                <CompanyBadge isVerified={job.is_verified} isPartner={job.is_partner} />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <Badge variant="secondary" className="text-xs">{tradeLabels[job.trade_category] || job.trade_category}</Badge>
            <Badge variant="outline" className="text-xs">{typeLabels[job.employment_type] || job.employment_type}</Badge>
            {!!job.is_remote && <Badge variant="outline" className="text-xs">Remote</Badge>}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {job.city}, {job.state}
            </span>
            {salary && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {salary}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {timeAgo(job.created_at)}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

import { BadgeCheck, Handshake } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CompanyBadgeProps {
  isVerified?: boolean | number;
  isPartner?: boolean | number;
  className?: string;
}

export function CompanyBadge({ isVerified, isPartner, className = '' }: CompanyBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      {!!isPartner && (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-amber-600 hover:bg-amber-700 gap-0.5">
          <Handshake className="h-3 w-3" />
          Partner
        </Badge>
      )}
      {!!isVerified && (
        <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-blue-600 hover:bg-blue-700 gap-0.5">
          <BadgeCheck className="h-3 w-3" />
          Verified
        </Badge>
      )}
    </span>
  );
}

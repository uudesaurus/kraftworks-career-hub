import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export function CareerFairBanner() {
  return (
    <div className="rounded-xl border border-border bg-secondary p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
      <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
        <Users className="h-7 w-7 text-primary" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
          <h3 className="text-lg font-heading font-bold text-white">Kraftworks Digital Career Fair</h3>
          <Badge variant="secondary" className="text-[10px] bg-primary/20 text-primary border-0">Coming Soon</Badge>
        </div>
        <p className="text-sm text-white/70 max-w-md">
          A new way to get hired in the trades, connecting trade graduates with employers hiring for real roles
        </p>
      </div>
      <Link to="/career-fair">
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
          Learn More
          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>);

}
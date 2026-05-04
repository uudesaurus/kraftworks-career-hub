import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';

interface JobFiltersProps {
  search: string;
  tradeCategory: string;
  employmentType: string;
  state: string;
  onSearchChange: (v: string) => void;
  onTradeCategoryChange: (v: string) => void;
  onEmploymentTypeChange: (v: string) => void;
  onStateChange: (v: string) => void;
  onClear: () => void;
}

const trades = [
  { value: '', label: 'All Trades' },
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'welding', label: 'Welding' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'general', label: 'General' },
];

const employmentTypes = [
  { value: '', label: 'All Types' },
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
];

const states = [
  '', 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR',
];

export function JobFilters({
  search, tradeCategory, employmentType, state,
  onSearchChange, onTradeCategoryChange, onEmploymentTypeChange, onStateChange, onClear,
}: JobFiltersProps) {
  const hasFilters = search || tradeCategory || employmentType || state;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs, companies..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Select value={tradeCategory} onValueChange={onTradeCategoryChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            {trades.map(t => (
              <SelectItem key={t.value || 'all'} value={t.value || 'all'}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={employmentType} onValueChange={onEmploymentTypeChange}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            {employmentTypes.map(t => (
              <SelectItem key={t.value || 'all'} value={t.value || 'all'}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={state} onValueChange={onStateChange}>
          <SelectTrigger className="w-full sm:w-[100px]">
            <SelectValue placeholder="State" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All States</SelectItem>
            {states.filter(Boolean).map(s => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-1">
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { EmployerLayout } from '@/components/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { employerApi } from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Plus, X } from 'lucide-react';

const TRADES = [
  { value: 'electrician', label: 'Electrician' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'welding', label: 'Welding' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'carpentry', label: 'Carpentry' },
  { value: 'general', label: 'General' },
];

const TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
];

const STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'closed', label: 'Closed' },
];

const SALARY_PERIODS = [
  { value: 'hourly', label: 'Hourly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR',
];

const emptyForm = {
  title: '',
  description: '',
  trade_category: '',
  employment_type: '',
  experience_level: '',
  salary_min: '',
  salary_max: '',
  salary_period: '',
  city: '',
  state: '',
  is_remote: false,
  application_deadline: '',
  status: 'active',
  requirements: [] as string[],
  benefits: [] as string[],
};

export default function EmployerJobForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [newReq, setNewReq] = useState('');
  const [newBen, setNewBen] = useState('');

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const data = await employerApi.getJob(id);
        const job = data.job ?? data;
        setForm({
          title: job.title || '',
          description: job.description || '',
          trade_category: job.trade_category || '',
          employment_type: job.employment_type || '',
          experience_level: job.experience_level || '',
          salary_min: job.salary_min?.toString() || '',
          salary_max: job.salary_max?.toString() || '',
          salary_period: job.salary_period || '',
          city: job.city || '',
          state: job.state || '',
          is_remote: !!job.is_remote,
          application_deadline: job.application_deadline?.split('T')[0] || '',
          status: job.status || 'active',
          requirements: typeof job.requirements === 'string' ? JSON.parse(job.requirements || '[]') : (job.requirements || []),
          benefits: typeof job.benefits === 'string' ? JSON.parse(job.benefits || '[]') : (job.benefits || []),
        });
      } catch {
        toast.error('Failed to load job');
        navigate('/employer/jobs');
      }
      setLoading(false);
    })();
  }, [id, navigate]);

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const addReq = () => {
    if (!newReq.trim()) return;
    setForm(prev => ({ ...prev, requirements: [...prev.requirements, newReq.trim()] }));
    setNewReq('');
  };

  const removeReq = (i: number) => setForm(prev => ({ ...prev, requirements: prev.requirements.filter((_, idx) => idx !== i) }));

  const addBen = () => {
    if (!newBen.trim()) return;
    setForm(prev => ({ ...prev, benefits: [...prev.benefits, newBen.trim()] }));
    setNewBen('');
  };

  const removeBen = (i: number) => setForm(prev => ({ ...prev, benefits: prev.benefits.filter((_, idx) => idx !== i) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.trade_category || !form.employment_type || !form.city.trim() || !form.state) {
      toast.error('Please fill in all required fields (title, description, trade, type, city, state)');
      return;
    }
    setSubmitting(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      trade_category: form.trade_category,
      employment_type: form.employment_type,
      experience_level: form.experience_level.trim() || undefined,
      salary_min: form.salary_min ? Number(form.salary_min) : undefined,
      salary_max: form.salary_max ? Number(form.salary_max) : undefined,
      salary_period: form.salary_period || undefined,
      city: form.city.trim(),
      state: form.state,
      is_remote: form.is_remote ? 1 : 0,
      application_deadline: form.application_deadline || undefined,
      status: form.status,
      requirements: form.requirements,
      benefits: form.benefits,
    };
    try {
      if (isEdit) {
        await employerApi.updateJob(id!, payload);
        toast.success('Job updated');
      } else {
        await employerApi.createJob(payload);
        toast.success('Job created');
      }
      navigate('/employer/jobs');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save job listing');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="max-w-3xl mx-auto">
        <Link to="/employer/jobs" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />Back to listings
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>{isEdit ? 'Edit Job Listing' : 'Post New Job'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic info */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Job Title *</Label>
                  <Input value={form.title} onChange={e => update('title', e.target.value)} placeholder="Senior Electrician" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Trade Category *</Label>
                  <Select value={form.trade_category} onValueChange={v => update('trade_category', v)}>
                    <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                    <SelectContent>{TRADES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Employment Type *</Label>
                  <Select value={form.employment_type} onValueChange={v => update('employment_type', v)}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>{TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Experience Level</Label>
                  <Input value={form.experience_level} onChange={e => update('experience_level', e.target.value)} placeholder="e.g. 3+ years" />
                </div>
                {isEdit && (
                  <div className="space-y-1.5">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => update('status', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label>Job Description *</Label>
                <Textarea value={form.description} onChange={e => update('description', e.target.value)} placeholder="Describe the role, responsibilities, and what a typical day looks like..." rows={6} required />
              </div>

              {/* Location */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>City *</Label>
                  <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Denver" required />
                </div>
                <div className="space-y-1.5">
                  <Label>State *</Label>
                  <Select value={form.state} onValueChange={v => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex items-end">
                  <div className="flex items-center gap-2 h-10">
                    <Switch checked={form.is_remote} onCheckedChange={v => update('is_remote', v)} id="remote" />
                    <Label htmlFor="remote">Remote</Label>
                  </div>
                </div>
              </div>

              {/* Salary */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label>Salary Min ($)</Label>
                  <Input type="number" value={form.salary_min} onChange={e => update('salary_min', e.target.value)} placeholder="40000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Salary Max ($)</Label>
                  <Input type="number" value={form.salary_max} onChange={e => update('salary_max', e.target.value)} placeholder="65000" />
                </div>
                <div className="space-y-1.5">
                  <Label>Pay Period</Label>
                  <Select value={form.salary_period} onValueChange={v => update('salary_period', v)}>
                    <SelectTrigger><SelectValue placeholder="Period" /></SelectTrigger>
                    <SelectContent>{SALARY_PERIODS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Deadline */}
              <div className="space-y-1.5 w-full sm:max-w-xs">
                <Label>Application Deadline</Label>
                <Input type="date" value={form.application_deadline} onChange={e => update('application_deadline', e.target.value)} />
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <Label>Requirements</Label>
                {form.requirements.map((r, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm bg-muted px-3 py-1.5 rounded-md">{r}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeReq(i)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input value={newReq} onChange={e => setNewReq(e.target.value)} placeholder="Add requirement" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReq())} />
                  <Button type="button" variant="outline" size="sm" onClick={addReq}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-2">
                <Label>Benefits</Label>
                {form.benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="flex-1 text-sm bg-muted px-3 py-1.5 rounded-md">{b}</span>
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBen(i)}><X className="h-3.5 w-3.5" /></Button>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <Input value={newBen} onChange={e => setNewBen(e.target.value)} placeholder="Add benefit" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBen())} />
                  <Button type="button" variant="outline" size="sm" onClick={addBen}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate('/employer/jobs')}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : isEdit ? 'Update Job' : 'Publish Job'}</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </EmployerLayout>
  );
}

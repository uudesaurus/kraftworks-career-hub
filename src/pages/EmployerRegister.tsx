import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { employerApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft, Building2 } from 'lucide-react';

const MAIN_APP_URL = import.meta.env.VITE_MAIN_APP_URL || 'https://career.kraftworks.app';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR',
];

const COMPANY_SIZES = [
  { value: '1-10', label: '1–10 employees' },
  { value: '11-50', label: '11–50 employees' },
  { value: '51-200', label: '51–200 employees' },
  { value: '201-500', label: '201–500 employees' },
  { value: '500+', label: '500+ employees' },
];

export default function EmployerRegister() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    company_website: '',
    industry: '',
    company_size: '',
    description: '',
    city: '',
    state: '',
  });

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <PageLayout>
        <div className="max-w-md mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to register your company.</p>
          <Button asChild><Link to="/employer/auth">Sign In</Link></Button>
        </div>
      </PageLayout>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.company_email.trim() || !form.city.trim() || !form.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await employerApi.createCompany({
        company_name: form.company_name.trim(),
        company_email: form.company_email.trim(),
        company_phone: form.company_phone.trim() || undefined,
        company_website: form.company_website.trim() || undefined,
        industry: form.industry.trim() || undefined,
        company_size: form.company_size || undefined,
        description: form.description.trim() || undefined,
        city: form.city.trim(),
        state: form.state,
      });
      toast.success('Company registered! Your profile is pending review.');
      navigate('/employer');
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <a href={`${MAIN_APP_URL}/career-fair`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Career Fair
        </a>

        <Card>
          <CardHeader className="text-center">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Register Your Company</CardTitle>
            <CardDescription>Fill in your company details to start posting jobs</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input id="company_name" value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Acme Electrical Services" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company_email">Company Email *</Label>
                  <Input id="company_email" type="email" value={form.company_email} onChange={e => update('company_email', e.target.value)} placeholder="hr@acme.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company_phone">Phone</Label>
                  <Input id="company_phone" value={form.company_phone} onChange={e => update('company_phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company_website">Website</Label>
                  <Input id="company_website" value={form.company_website} onChange={e => update('company_website', e.target.value)} placeholder="https://acme.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="industry">Industry</Label>
                  <Input id="industry" value={form.industry} onChange={e => update('industry', e.target.value)} placeholder="Electrical Contracting" />
                </div>
                <div className="space-y-1.5">
                  <Label>Company Size</Label>
                  <Select value={form.company_size} onValueChange={(v) => update('company_size', v)}>
                    <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                    <SelectContent>
                      {COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="city">City *</Label>
                  <Input id="city" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Denver" required />
                </div>
                <div className="space-y-1.5">
                  <Label>State *</Label>
                  <Select value={form.state} onValueChange={(v) => update('state', v)}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                    <SelectContent>
                      {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Company Description</Label>
                <Textarea id="description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell candidates about your company..." rows={4} />
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Registering...' : 'Register Company'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

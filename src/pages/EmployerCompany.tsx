import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmployerLayout } from '@/components/EmployerLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { employerApi } from '@/lib/api';
import { toast } from 'sonner';
import { Building2, Mail, Phone, Globe, MapPin, RefreshCw } from 'lucide-react';

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

const INDUSTRIES = [
  'Construction', 'Electrical', 'HVAC & Mechanical', 'Plumbing', 'Welding & Fabrication',
  'General Contracting', 'Residential', 'Commercial', 'Industrial', 'Maintenance',
  'Renewable Energy', 'Utilities', 'Manufacturing', 'Other',
];

export default function EmployerCompany() {
  const navigate = useNavigate();
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employerApi.getCompany();
      const c = data.company ?? data;
      if (c) {
        setCompany(c);
        setForm({
          company_name: c.company_name || '',
          company_email: c.company_email || '',
          company_phone: c.company_phone || '',
          company_website: c.company_website || '',
          industry: c.industry || '',
          company_size: c.company_size || '',
          description: c.description || '',
          city: c.city || '',
          state: c.state || '',
        });
      }
    } catch {
      setError('Failed to load company profile.');
    }
    setLoading(false);
  };

  useEffect(() => { fetchCompany(); }, []);

  const update = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const profileFields = [
    { key: 'company_name', label: 'Company name' },
    { key: 'company_email', label: 'Email' },
    { key: 'description', label: 'Description' },
    { key: 'industry', label: 'Industry' },
    { key: 'company_size', label: 'Company size' },
    { key: 'company_phone', label: 'Phone' },
    { key: 'company_website', label: 'Website' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
  ];
  const filledCount = profileFields.filter(f => form[f.key as keyof typeof form]?.trim()).length;
  const completeness = Math.round((filledCount / profileFields.length) * 100);
  const missingFields = profileFields.filter(f => !form[f.key as keyof typeof form]?.trim());

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name.trim() || !form.company_email.trim()) {
      toast.error('Company name and email are required');
      return;
    }
    setSaving(true);
    try {
      await employerApi.updateCompany(form);
      toast.success('Company profile updated');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <EmployerLayout>
        <div className="max-w-4xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </EmployerLayout>
    );
  }

  if (error && !company) {
    return (
      <EmployerLayout>
        <div className="max-w-md mx-auto text-center py-20 space-y-4">
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchCompany} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      </EmployerLayout>
    );
  }

  if (!company) {
    return (
      <EmployerLayout>
        <div className="max-w-lg mx-auto text-center py-20 space-y-6">
          <h1 className="text-2xl font-heading font-bold">No Company Profile</h1>
          <p className="text-muted-foreground">Register your company to get started.</p>
          <Button onClick={() => navigate('/employer/register')} size="lg">Register Company</Button>
        </div>
      </EmployerLayout>
    );
  }

  return (
    <EmployerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-heading font-bold">Company Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage how your company appears to candidates</p>
          </div>
          <Badge variant={company.status === 'active' ? 'default' : company.status === 'suspended' ? 'destructive' : 'secondary'}>
            {company.status?.replace('_', ' ')}
          </Badge>
        </div>

        {/* Profile Completeness */}
        {completeness < 100 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Profile completeness</p>
                <span className="text-sm font-semibold">{completeness}%</span>
              </div>
              <Progress value={completeness} className="h-2 mb-2" />
              {missingFields.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Missing: {missingFields.map(f => f.label).join(', ')}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="edit" className="space-y-6">
          <TabsList>
            <TabsTrigger value="edit">Edit Profile</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <form onSubmit={handleSave}>
              <div className="space-y-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Basic Information</CardTitle>
                    <CardDescription>Core details about your company</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Company Name *</Label>
                        <Input value={form.company_name} onChange={e => update('company_name', e.target.value)} required placeholder="Acme Electrical Services" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Industry</Label>
                        <Select value={form.industry} onValueChange={v => update('industry', v)}>
                          <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                          <SelectContent>
                            {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label>Company Size</Label>
                        <Select value={form.company_size} onValueChange={v => update('company_size', v)}>
                          <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                          <SelectContent>
                            {COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Company Description</Label>
                        <Textarea
                          value={form.description}
                          onChange={e => update('description', e.target.value)}
                          rows={5}
                          placeholder="Tell candidates about your company, culture, and what makes you a great employer..."
                        />
                        <p className="text-xs text-muted-foreground">{form.description.length}/500 characters</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Contact Information</CardTitle>
                    <CardDescription>How candidates can reach you</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>Company Email *</Label>
                        <Input type="email" value={form.company_email} onChange={e => update('company_email', e.target.value)} required placeholder="jobs@company.com" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>Phone</Label>
                        <Input value={form.company_phone} onChange={e => update('company_phone', e.target.value)} placeholder="(555) 123-4567" />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label>Website</Label>
                        <Input value={form.company_website} onChange={e => update('company_website', e.target.value)} placeholder="https://www.company.com" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Location */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Location</CardTitle>
                    <CardDescription>Your company headquarters</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label>City</Label>
                        <Input value={form.city} onChange={e => update('city', e.target.value)} placeholder="Denver" />
                      </div>
                      <div className="space-y-1.5">
                        <Label>State</Label>
                        <Select value={form.state} onValueChange={v => update('state', v)}>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                          <SelectContent>
                            {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                  <Button type="submit" disabled={saving} size="lg">
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardContent className="py-8">
                <div className="max-w-2xl mx-auto">
                  {/* Company header */}
                  <div className="mb-6">
                    <h2 className="text-xl font-bold">{form.company_name || 'Company Name'}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                      {form.industry && <span>{form.industry}</span>}
                      {form.company_size && <span>· {form.company_size} employees</span>}
                      {form.city && form.state && <span>· {form.city}, {form.state}</span>}
                    </div>
                  </div>

                  {/* Description */}
                  {form.description ? (
                    <div className="mb-6">
                      <h3 className="text-sm font-semibold mb-2">About</h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.description}</p>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 rounded-lg border border-dashed border-muted-foreground/30 text-center">
                      <p className="text-sm text-muted-foreground">Add a description to tell candidates about your company</p>
                    </div>
                  )}

                  {/* Contact */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {form.company_email && (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{form.company_email}</span>
                      </div>
                    )}
                    {form.company_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{form.company_phone}</span>
                      </div>
                    )}
                    {form.company_website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="text-primary">{form.company_website}</span>
                      </div>
                    )}
                    {form.city && form.state && (
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{form.city}, {form.state}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </EmployerLayout>
  );
}

import { useState, useEffect } from 'react';
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
import { ArrowLeft, Building2, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

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

  // Access request status check
  const [accessRequest, setAccessRequest] = useState<any>(null);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [hasCompany, setHasCompany] = useState(false);

  // Access request form
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
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

  // Company creation form (only shown after approved)
  const [companyForm, setCompanyForm] = useState({
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

  useEffect(() => {
    if (!user) { setCheckingAccess(false); return; }
    Promise.all([
      employerApi.getAccessRequest().catch(() => null),
      employerApi.getCompany().catch(() => null),
    ]).then(([accessData, companyData]) => {
      setAccessRequest(accessData?.request || null);
      const company = companyData?.company || companyData;
      setHasCompany(!!company);
      if (company) navigate('/employer', { replace: true });
    }).catch(() => {}).finally(() => setCheckingAccess(false));
  }, [user]);

  const updateRequest = (field: string, value: string) => setRequestForm(prev => ({ ...prev, [field]: value }));
  const updateCompany = (field: string, value: string) => setCompanyForm(prev => ({ ...prev, [field]: value }));

  if (authLoading || checkingAccess) {
    return (
      <PageLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </PageLayout>
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

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestForm.company_name.trim() || !requestForm.company_email.trim() || !requestForm.city.trim() || !requestForm.state) {
      toast.error('Please fill in company name, email, city, and state');
      return;
    }
    setSubmitting(true);
    try {
      await employerApi.submitAccessRequest({
        company_name: requestForm.company_name.trim(),
        company_email: requestForm.company_email.trim(),
        company_phone: requestForm.company_phone.trim() || undefined,
        company_website: requestForm.company_website.trim() || undefined,
        industry: requestForm.industry.trim() || undefined,
        company_size: requestForm.company_size || undefined,
        description: requestForm.description.trim() || undefined,
        city: requestForm.city.trim(),
        state: requestForm.state,
      });
      toast.success('Access request submitted! You\'ll receive an email once approved.');
      setAccessRequest({ status: 'pending' });
      setShowRequestForm(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit request');
    }
    setSubmitting(false);
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.company_name.trim() || !companyForm.company_email.trim() || !companyForm.city.trim() || !companyForm.state) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await employerApi.createCompany({
        company_name: companyForm.company_name.trim(),
        company_email: companyForm.company_email.trim(),
        company_phone: companyForm.company_phone.trim() || undefined,
        company_website: companyForm.company_website.trim() || undefined,
        industry: companyForm.industry.trim() || undefined,
        company_size: companyForm.company_size || undefined,
        description: companyForm.description.trim() || undefined,
        city: companyForm.city.trim(),
        state: companyForm.state,
      });
      toast.success('Company registered! You can now post jobs.');
      navigate('/employer');
    } catch (err: any) {
      toast.error(err?.message || 'Registration failed');
    }
    setSubmitting(false);
  };

  const statusIcon = () => {
    if (!accessRequest) return null;
    if (accessRequest.status === 'pending') return <Clock className="h-5 w-5 text-amber-500" />;
    if (accessRequest.status === 'approved') return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (accessRequest.status === 'rejected') return <XCircle className="h-5 w-5 text-red-500" />;
    return null;
  };

  const statusLabel = () => {
    if (!accessRequest) return null;
    const labels: Record<string, string> = { pending: 'Pending Review', approved: 'Approved', rejected: 'Rejected' };
    return labels[accessRequest.status] || accessRequest.status;
  };

  const statusColor = () => {
    if (!accessRequest) return '';
    if (accessRequest.status === 'pending') return 'bg-amber-50 border-amber-200';
    if (accessRequest.status === 'approved') return 'bg-green-50 border-green-200';
    if (accessRequest.status === 'rejected') return 'bg-red-50 border-red-200';
    return '';
  };

  return (
    <PageLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <a href={`${MAIN_APP_URL}/career-fair`} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Back to Career Fair
        </a>

        {/* Access Request Status Banner */}
        {accessRequest && accessRequest.status === 'pending' && (
          <div className={`mb-6 p-4 rounded-lg border ${statusColor()}`}>
            <div className="flex items-center gap-3">
              {statusIcon()}
              <div>
                <p className="font-medium text-sm">Access Request Submitted</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your request is being reviewed by our team. You'll receive an email at <strong>{user.email}</strong> once approved. This usually takes 1–2 business days.
                </p>
              </div>
            </div>
          </div>
        )}

        {accessRequest && accessRequest.status === 'approved' && !hasCompany && (
          <div className={`mb-6 p-4 rounded-lg border ${statusColor()}`}>
            <div className="flex items-center gap-3">
              {statusIcon()}
              <div>
                <p className="font-medium text-sm">Access Approved!</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your employer access has been approved. Complete your company profile below to start posting jobs.
                </p>
              </div>
            </div>
          </div>
        )}

        {accessRequest && accessRequest.status === 'rejected' && (
          <div className={`mb-6 p-4 rounded-lg border ${statusColor()}`}>
            <div className="flex items-center gap-3">
              {statusIcon()}
              <div>
                <p className="font-medium text-sm">Request Rejected</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {accessRequest.admin_notes ? `Reason: ${accessRequest.admin_notes}` : 'Your request was not approved. Please contact us for more information.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* No existing request — show request form */}
        {!accessRequest && !showRequestForm && (
          <Card>
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Post Jobs on Kraftworks</CardTitle>
              <CardDescription>Submit your company details to get started. Our team will review and approve your access.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg" onClick={() => setShowRequestForm(true)}>
                Request Employer Access
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Request Access Form */}
        {showRequestForm && (
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Request Employer Access</CardTitle>
              <CardDescription>Fill in your company details. Our team will review and notify you via email once approved.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRequestAccess} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="req_company_name">Company Name *</Label>
                    <Input id="req_company_name" value={requestForm.company_name} onChange={e => updateRequest('company_name', e.target.value)} placeholder="Acme Electrical Services" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req_company_email">Company Email *</Label>
                    <Input id="req_company_email" type="email" value={requestForm.company_email} onChange={e => updateRequest('company_email', e.target.value)} placeholder="hr@acme.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req_company_phone">Phone</Label>
                    <Input id="req_company_phone" value={requestForm.company_phone} onChange={e => updateRequest('company_phone', e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req_company_website">Website</Label>
                    <Input id="req_company_website" value={requestForm.company_website} onChange={e => updateRequest('company_website', e.target.value)} placeholder="https://acme.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req_industry">Industry</Label>
                    <Input id="req_industry" value={requestForm.industry} onChange={e => updateRequest('industry', e.target.value)} placeholder="Electrical Contracting" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company Size</Label>
                    <Select value={requestForm.company_size} onValueChange={(v) => updateRequest('company_size', v)}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="req_city">City *</Label>
                    <Input id="req_city" value={requestForm.city} onChange={e => updateRequest('city', e.target.value)} placeholder="Denver" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State *</Label>
                    <Select value={requestForm.state} onValueChange={(v) => updateRequest('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req_description">Company Description</Label>
                  <Textarea id="req_description" value={requestForm.description} onChange={e => updateRequest('description', e.target.value)} placeholder="Tell candidates about your company..." rows={3} />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button type="button" variant="ghost" className="w-full" onClick={() => setShowRequestForm(false)}>
                  Cancel
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Approved — show company creation form */}
        {accessRequest?.status === 'approved' && !hasCompany && (
          <Card>
            <CardHeader className="text-center">
              <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Complete Your Company Profile</CardTitle>
              <CardDescription>You're approved! Fill in your details to start posting jobs.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateCompany} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input id="company_name" value={companyForm.company_name} onChange={e => updateCompany('company_name', e.target.value)} placeholder="Acme Electrical Services" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company_email">Company Email *</Label>
                    <Input id="company_email" type="email" value={companyForm.company_email} onChange={e => updateCompany('company_email', e.target.value)} placeholder="hr@acme.com" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company_phone">Phone</Label>
                    <Input id="company_phone" value={companyForm.company_phone} onChange={e => updateCompany('company_phone', e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="company_website">Website</Label>
                    <Input id="company_website" value={companyForm.company_website} onChange={e => updateCompany('company_website', e.target.value)} placeholder="https://acme.com" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="industry">Industry</Label>
                    <Input id="industry" value={companyForm.industry} onChange={e => updateCompany('industry', e.target.value)} placeholder="Electrical Contracting" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Company Size</Label>
                    <Select value={companyForm.company_size} onValueChange={(v) => updateCompany('company_size', v)}>
                      <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" value={companyForm.city} onChange={e => updateCompany('city', e.target.value)} placeholder="Denver" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State *</Label>
                    <Select value={companyForm.state} onValueChange={(v) => updateCompany('state', v)}>
                      <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                      <SelectContent>
                        {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description">Company Description</Label>
                  <Textarea id="description" value={companyForm.description} onChange={e => updateCompany('description', e.target.value)} placeholder="Tell candidates about your company..." rows={4} />
                </div>
                <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Create Company Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </PageLayout>
  );
}

import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { employerApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Building2, Clock, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

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

interface EmployerProtectedRouteProps {
  children: React.ReactNode;
}

export function EmployerProtectedRoute({ children }: EmployerProtectedRouteProps) {
  const { user, loading: authLoading } = useAuth();
  const [roleData, setRoleData] = useState<{ role: string; accessRequest: any } | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
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

  useEffect(() => {
    if (!user) { setCheckingRole(false); return; }

    const checkRole = async () => {
      try {
        const data = await employerApi.roleCheck();
        setRoleData(data);
      } catch {
        // On error, let them through (fail open for non-critical check)
      }
      setCheckingRole(false);
    };
    checkRole();
  }, [user]);

  if (authLoading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/employer/auth" replace />;
  }

  // Non-employer/admin detected — show gating UI (employees AND new sign-ups must request access)
  if (roleData && roleData.role !== 'employer' && roleData.role !== 'admin') {
    const req = roleData.accessRequest;

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.company_name.trim() || !form.company_email.trim() || !form.city.trim() || !form.state) {
        toast.error('Please fill in all required fields');
        return;
      }
      setSubmitting(true);
      try {
        await employerApi.submitAccessRequest({
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
        toast.success('Request submitted! We\'ll review it and email you.');
        setRoleData(prev => prev ? { ...prev, accessRequest: { status: 'pending' } } : prev);
        setShowRequestModal(false);
      } catch (err: any) {
        toast.error(err?.message || 'Failed to submit request');
      } finally {
        setSubmitting(false);
      }
    };

    // Already has a request
    if (req) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-2xl flex items-center justify-center bg-primary/10">
              {req.status === 'pending' && <Clock className="h-8 w-8 text-amber-500" />}
              {req.status === 'approved' && <CheckCircle2 className="h-8 w-8 text-green-500" />}
              {req.status === 'rejected' && <XCircle className="h-8 w-8 text-red-500" />}
            </div>

            {req.status === 'pending' && (
              <>
                <h1 className="text-2xl font-heading font-bold">Request Under Review</h1>
                <p className="text-muted-foreground">
                  Your employer access request for <strong>{req.company_name || 'your company'}</strong> is being reviewed.
                  We'll email you once a decision is made. This usually takes 1–2 business days.
                </p>
              </>
            )}

            {req.status === 'approved' && (
              <>
                <h1 className="text-2xl font-heading font-bold text-green-600">Access Approved!</h1>
                <p className="text-muted-foreground">
                  Your employer access has been approved. Please refresh this page to access the employer portal.
                </p>
                <Button onClick={() => window.location.reload()}>Refresh Page</Button>
              </>
            )}

            {req.status === 'rejected' && (
              <>
                <h1 className="text-2xl font-heading font-bold text-red-600">Request Not Approved</h1>
                <p className="text-muted-foreground">
                  Unfortunately, your employer access request was not approved at this time.
                  {req.admin_notes && <><br /><br /><em>Reason: {req.admin_notes}</em></>}
                </p>
                <p className="text-sm text-muted-foreground">
                  If you believe this was a mistake, please contact us at{' '}
                  <a href="mailto:info@kraftworks.com" className="text-primary underline">info@kraftworks.com</a>
                </p>
              </>
            )}

            <a
              href={`${MAIN_APP_URL}/dashboard`}
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Main Dashboard
            </a>
          </div>
        </div>
      );
    }

    // No request yet — show info page + request modal
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Employer Access Required</h1>
          <p className="text-muted-foreground">
            To post jobs and access employer features, we need to review your company details first.
            Please submit your company information and our team will get back to you.
          </p>
          <p className="text-sm text-muted-foreground">
            Submit your company information below and our team will review it.
            We'll send you an email once your access is approved.
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => setShowRequestModal(true)}>
              Request Employer Access
            </Button>
            <a
              href={`${MAIN_APP_URL}/dashboard`}
              className="inline-flex items-center justify-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
              Back to Main Dashboard
            </a>
          </div>
        </div>

        <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                Request Employer Access
              </DialogTitle>
              <DialogDescription>
                Fill in your company details. We'll review them and email you once approved.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="req_company_name">Company Name *</Label>
                  <Input id="req_company_name" value={form.company_name} onChange={e => update('company_name', e.target.value)} placeholder="Acme Electrical Services" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req_company_email">Company Email *</Label>
                  <Input id="req_company_email" type="email" value={form.company_email} onChange={e => update('company_email', e.target.value)} placeholder="hr@acme.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req_company_phone">Phone</Label>
                  <Input id="req_company_phone" value={form.company_phone} onChange={e => update('company_phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req_company_website">Website</Label>
                  <Input id="req_company_website" value={form.company_website} onChange={e => update('company_website', e.target.value)} placeholder="https://acme.com" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req_industry">Industry</Label>
                  <Input id="req_industry" value={form.industry} onChange={e => update('industry', e.target.value)} placeholder="Electrical Contracting" />
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
                  <Label htmlFor="req_city">City *</Label>
                  <Input id="req_city" value={form.city} onChange={e => update('city', e.target.value)} placeholder="Denver" required />
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
                <Label htmlFor="req_description">Company Description</Label>
                <Textarea id="req_description" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us about your company..." rows={3} />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Employer or admin — allow through
  return <>{children}</>;
}

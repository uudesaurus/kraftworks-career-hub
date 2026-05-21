import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAdminRole } from '@/hooks/useAdminRole';
import { useAuth } from '@/hooks/useAuth';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Shield, Download, Search, FileText, Eye, Pencil, ClipboardList, Mail, Trash2, RefreshCw, Users, ChevronDown, ChevronRight, ShieldCheck, ShieldOff, Plus, Minus, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

// --- Types ---
interface FeedbackRow {
  id: string;
  user_id: string;
  resume_id: string;
  resume_hash: string;
  status: string;
  strengths: string[];
  improvements: string[];
  suggestions: string[];
  overall_score: number | null;
  trade_suggestions: string[];
  actionable_steps: string[];
  created_at: string;
  user_email?: string;
  resume_file_name?: string;
}

interface TradeGradRow {
  id: string;
  full_name: string;
  email: string;
  trade_program: string;
  state: string;
  city: string;
  created_at: string;
}

interface EmployerRow {
  id: string;
  full_name: string;
  job_title: string;
  company_email: string;
  trades_hiring_for: string;
  hiring_volume: string;
  state: string;
  city: string;
  created_at: string;
}

interface AuditRow {
  id: string;
  actor_user_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  before_json: any;
  after_json: any;
  created_at: string;
}

interface UserListRow {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  role: string;
  credit_limit: number;
  resume_count: number;
  feedback_count: number;
  questions_count: number;
  ai_actions_used: number;
}

interface UserDetail {
  user: { id: string; email: string; full_name: string | null; created_at: string; role: string; credit_limit: number; ai_actions_used: number };
  resumes: { id: string; file_name: string; file_size: number; trade_program: string | null; is_active: number; created_at: string }[];
  feedback: FeedbackRow[];
  questions: { id: string; job_description: string; technical: string[]; behavioral: string[]; situational: string[]; created_at: string }[];
  aiUsage: { id: string; action_type: string; created_at: string }[];
  waitlistMatch: { tradeGrad: TradeGradRow | null; employer: EmployerRow | null };
}

// --- CSV Export ---
function exportCSV(headers: string[], rows: string[][], filename: string) {
  const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Search filter helper ---
function matchesSearch(obj: Record<string, any>, query: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  return Object.values(obj).some(v => String(v ?? '').toLowerCase().includes(q));
}

// --- Employer Access Requests Tab ---
function EmployerAccessRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getEmployerRequests()
      .then((d: any) => setRequests(d.requests ?? d ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setProcessing(id);
    try {
      await adminApi.approveEmployerRequest(id);
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
      toast.success('Employer access approved! Company created & user notified.');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve');
    }
    setProcessing(null);
  };

  const handleReject = async () => {
    if (!rejectId) return;
    setProcessing(rejectId);
    try {
      await adminApi.rejectEmployerRequest(rejectId, rejectNotes.trim() || undefined);
      setRequests(prev => prev.map(r => r.id === rejectId ? { ...r, status: 'rejected', admin_notes: rejectNotes } : r));
      toast.success('Request rejected. User notified.');
      setRejectId(null);
      setRejectNotes('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject');
    }
    setProcessing(null);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return <div className="py-8"><Skeleton className="h-48 w-full" /></div>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Employer Access Requests ({requests.length})
            {pendingCount > 0 && (
              <Badge className="ml-2 bg-amber-100 text-amber-800">{pendingCount} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No employer access requests.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Requester</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(r => (
                    <TableRow key={r.id} className={r.status === 'pending' ? 'bg-amber-50/50' : ''}>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">{r.user_full_name || '—'}</span>
                          <div className="text-xs text-muted-foreground">{r.user_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{r.company_name}</TableCell>
                      <TableCell className="text-sm">{r.company_email}</TableCell>
                      <TableCell className="text-sm">{r.city}, {r.state}</TableCell>
                      <TableCell className="text-sm">{r.industry || '—'}</TableCell>
                      <TableCell>
                        <Badge className={
                          r.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          r.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }>
                          {r.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {r.status === 'pending' ? (
                          <div className="flex gap-1 justify-end">
                            <Button
                              size="sm"
                              className="text-xs h-7 bg-green-600 hover:bg-green-700"
                              onClick={() => handleApprove(r.id)}
                              disabled={processing === r.id}
                            >
                              {processing === r.id ? '...' : 'Approve'}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => { setRejectId(r.id); setRejectNotes(''); }}
                              disabled={processing === r.id}
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {r.admin_notes && `Note: ${r.admin_notes}`}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reject confirmation dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Employer Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The user will be notified via email. Optionally provide a reason:
            </p>
            <Textarea
              value={rejectNotes}
              onChange={e => setRejectNotes(e.target.value)}
              placeholder="Reason for rejection (optional)..."
              rows={3}
            />
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setRejectId(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleReject} disabled={processing === rejectId}>
                {processing === rejectId ? 'Rejecting...' : 'Reject Request'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// --- Career Fair Admin: Companies Tab ---
function CareerFairCompaniesTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesDialog, setNotesDialog] = useState<{ id: string; name: string; status: string } | null>(null);
  const [notesText, setNotesText] = useState('');

  useEffect(() => {
    adminApi.getCompanies().then((d: any) => setCompanies(d.companies ?? d ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleVerify = async (id: string) => {
    try {
      await adminApi.verifyCompany(id);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_verified: 1 } : c));
      toast.success('Company verified');
    } catch { toast.error('Failed'); }
  };

  const handleTogglePartner = async (id: string) => {
    try {
      await adminApi.togglePartner(id);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, is_partner: c.is_partner ? 0 : 1 } : c));
      toast.success('Partner status toggled');
    } catch { toast.error('Failed'); }
  };

  const openNotesDialog = (c: any) => {
    setNotesDialog({ id: c.id, name: c.company_name, status: c.status });
    setNotesText('');
  };

  const handleStatusWithNotes = async () => {
    if (!notesDialog) return;
    try {
      await adminApi.updateCompanyStatus(notesDialog.id, notesDialog.status, notesText.trim() || undefined);
      setCompanies(prev => prev.map(c => c.id === notesDialog.id ? { ...c, status: notesDialog.status } : c));
      toast.success('Status updated');
      setNotesDialog(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update status');
    }
  };

  const handleStatusQuick = async (id: string, newStatus: string) => {
    try {
      await adminApi.updateCompanyStatus(id, newStatus);
      setCompanies(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  if (loading) return <div className="py-8"><Skeleton className="h-48 w-full" /></div>;

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Registered Companies ({companies.length})</CardTitle></CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No companies registered.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.company_name}</TableCell>
                    <TableCell className="text-sm">{c.company_email}</TableCell>
                    <TableCell className="text-sm">{c.city}, {c.state}</TableCell>
                    <TableCell>
                      <Select value={c.status} onValueChange={v => handleStatus(c.id, v)}>
                        <SelectTrigger className="h-7 w-full sm:w-[130px] text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending_review">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {c.is_verified ? (
                        <Badge className="bg-blue-100 text-blue-800 text-xs">Verified</Badge>
                      ) : (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleVerify(c.id)}>Verify</Button>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant={c.is_partner ? 'secondary' : 'outline'} size="sm" className="text-xs h-7" onClick={() => handleTogglePartner(c.id)}>
                        {c.is_partner ? 'Partner ✓' : 'Make Partner'}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => openNotesDialog(c)} title="Update status with notes">
                        Notes
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleStatusQuick(c.id, c.status === 'active' ? 'suspended' : 'active')}>
                        {c.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Status + Notes Dialog */}
      <Dialog open={!!notesDialog} onOpenChange={() => setNotesDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Status — {notesDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={notesDialog?.status || 'active'} onValueChange={v => setNotesDialog(prev => prev ? { ...prev, status: v } : null)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending_review">Pending Review</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Internal Notes (optional)</Label>
              <Textarea
                value={notesText}
                onChange={e => setNotesText(e.target.value)}
                placeholder="Add notes about this company status change..."
                rows={3}
              />
              <p className="text-xs text-muted-foreground">Notes are saved with the status update but not visible to the employer.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotesDialog(null)}>Cancel</Button>
            <Button onClick={handleStatusWithNotes}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// --- Career Fair Admin: Jobs Tab ---
function CareerFairJobsTab() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_id: '', title: '', description: '', trade_category: 'general',
    employment_type: 'full_time', city: '', state: '', is_remote: false, status: 'active',
    internal_notes: '',
  });
  const [unscrapedMode, setUnscrapedMode] = useState(false);
  const [unscrapedCompany, setUnscrapedCompany] = useState({ name: '', city: '', state: '' });
  const [newReq, setNewReq] = useState('');
  const [newBen, setNewBen] = useState('');
  const [requirements, setRequirements] = useState<string[]>([]);
  const [benefits, setBenefits] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      adminApi.getAllJobs().then((d: any) => setJobs(d.jobs ?? d ?? [])),
      adminApi.getCompanies().then((d: any) => setCompanies(d.companies ?? d ?? [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleModerate = async (id: string, status: string) => {
    try {
      await adminApi.moderateJob(id, status);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
      toast.success('Job status updated');
    } catch { toast.error('Failed'); }
  };

  const handleFeature = async (id: string) => {
    try {
      await adminApi.toggleFeatured(id);
      setJobs(prev => prev.map(j => j.id === id ? { ...j, is_featured: j.is_featured ? 0 : 1 } : j));
      toast.success('Featured status toggled');
    } catch { toast.error('Failed'); }
  };

  const handleCreate = async () => {
    if (unscrapedMode) {
      if (!unscrapedCompany.name || !unscrapedCompany.city || !unscrapedCompany.state || !createForm.title || !createForm.description) {
        toast.error('Please fill in company name, city, state, title, and description');
        return;
      }
    } else {
      if (!createForm.company_id || !createForm.title || !createForm.description || !createForm.city || !createForm.state) {
        toast.error('Please fill in company, title, description, city, and state');
        return;
      }
    }
    setCreateLoading(true);
    try {
      const payload: any = {
        ...createForm,
        requirements,
        benefits,
        unscraped_mode: unscrapedMode,
        unscraped_company_name: unscrapedMode ? unscrapedCompany.name : undefined,
        unscraped_company_city: unscrapedMode ? unscrapedCompany.city : undefined,
        unscraped_company_state: unscrapedMode ? unscrapedCompany.state : undefined,
      };
      const result = await adminApi.createJob(payload);
      const newJob = (result as any).job;
      setJobs(prev => [newJob, ...prev]);
      setShowCreate(false);
      setCreateForm({ company_id: '', title: '', description: '', trade_category: 'general', employment_type: 'full_time', city: '', state: '', is_remote: false, status: 'active', internal_notes: '' });
      setRequirements([]);
      setBenefits([]);
      setUnscrapedMode(false);
      setUnscrapedCompany({ name: '', city: '', state: '' });
      toast.success('Job created');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create job');
    }
    setCreateLoading(false);
  };

  const addReq = () => { if (newReq.trim()) { setRequirements(prev => [...prev, newReq.trim()]); setNewReq(''); } };
  const addBen = () => { if (newBen.trim()) { setBenefits(prev => [...prev, newBen.trim()]); setNewBen(''); } };

  if (loading) return <div className="py-8"><Skeleton className="h-48 w-full" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">All Job Listings ({jobs.length})</CardTitle>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Create Job
          </Button>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No job listings.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Trade</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map(j => (
                    <TableRow key={j.id}>
                      <TableCell className="font-medium">{j.title}</TableCell>
                      <TableCell className="text-sm">{j.company_name || '—'}</TableCell>
                      <TableCell className="text-sm">{j.trade_category}</TableCell>
                      <TableCell>
                        <Select value={j.status} onValueChange={v => handleModerate(j.id, v)}>
                          <SelectTrigger className="h-7 w-full sm:w-[110px] text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="paused">Paused</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                            <SelectItem value="expired">Expired</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Button variant={j.is_featured ? 'secondary' : 'outline'} size="sm" className="text-xs h-7" onClick={() => handleFeature(j.id)}>
                          {j.is_featured ? '★ Featured' : 'Feature'}
                        </Button>
                      </TableCell>
                      <TableCell>{j.views_count ?? 0}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleModerate(j.id, j.status === 'active' ? 'closed' : 'active')}>
                          {j.status === 'active' ? 'Close' : 'Activate'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Job Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading">Create Job Listing</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg border border-muted bg-muted/30">
              <Checkbox
                id="unscrapedMode"
                checked={unscrapedMode}
                onCheckedChange={v => { setUnscrapedMode(!!v); setCreateForm(f => ({ ...f, company_id: '' })); }}
              />
              <div className="flex-1">
                <Label htmlFor="unscrapedMode" className="text-sm font-medium cursor-pointer">Post for unscraped company</Label>
                <p className="text-xs text-muted-foreground">Create a job for a company not in the system (e.g. scraped listings)</p>
              </div>
            </div>

            {unscrapedMode ? (
              <div className="space-y-3 p-3 rounded-lg border border-dashed border-border">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input
                    value={unscrapedCompany.name}
                    onChange={e => setUnscrapedCompany(c => ({ ...c, name: e.target.value }))}
                    placeholder="e.g. ABC Electric LLC"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>City *</Label>
                    <Input
                      value={unscrapedCompany.city}
                      onChange={e => setUnscrapedCompany(c => ({ ...c, city: e.target.value }))}
                      placeholder="Denver"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>State *</Label>
                    <Select value={unscrapedCompany.state} onValueChange={v => setUnscrapedCompany(c => ({ ...c, state: v }))}>
                      <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                      <SelectContent>
                        {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Company *</Label>
                <Select value={createForm.company_id} onValueChange={v => setCreateForm(f => ({ ...f, company_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                  <SelectContent>
                    {companies.filter(c => c.status === 'active').map(c => <SelectItem key={c.id} value={c.id}>{c.company_name}</SelectItem>)}
                    {companies.filter(c => c.status !== 'active').length > 0 && (
                      <p className="px-2 py-1.5 text-xs text-muted-foreground">
                        {companies.filter(c => c.status !== 'active').length} inactive company/companies not shown
                      </p>
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Input value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Senior Electrician" />
            </div>
            <div className="space-y-1.5">
              <Label>Description *</Label>
              <Textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the role..." rows={4} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Trade *</Label>
                <Select value={createForm.trade_category} onValueChange={v => setCreateForm(f => ({ ...f, trade_category: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['electrician','hvac','welding','plumbing','carpentry','general'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select value={createForm.employment_type} onValueChange={v => setCreateForm(f => ({ ...f, employment_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['full_time','part_time','contract','apprenticeship'].map(t => <SelectItem key={t} value={t}>{t.replace('_',' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>City *</Label>
                <Input value={createForm.city} onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))} placeholder="Denver" />
              </div>
              <div className="space-y-1.5">
                <Label>State *</Label>
                <Select value={createForm.state} onValueChange={v => setCreateForm(f => ({ ...f, state: v }))}>
                  <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                  <SelectContent>
                    {['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex items-end">
                <div className="flex items-center gap-2 h-10">
                  <Checkbox id="remote" checked={createForm.is_remote} onCheckedChange={v => setCreateForm(f => ({ ...f, is_remote: !!v }))} />
                  <Label htmlFor="remote">Remote</Label>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={createForm.status} onValueChange={v => setCreateForm(f => ({ ...f, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active (publish now)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Requirements (optional)</Label>
              {requirements.map((r, i) => <div key={i} className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-md">{r}<button className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => setRequirements(prev => prev.filter((_, idx) => idx !== i))}>×</button></div>)}
              <div className="flex gap-2">
                <Input value={newReq} onChange={e => setNewReq(e.target.value)} placeholder="Add requirement" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addReq())} />
                <Button type="button" variant="outline" size="sm" onClick={addReq}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Internal Notes (admin only)</Label>
              <Textarea
                value={createForm.internal_notes}
                onChange={e => setCreateForm(f => ({ ...f, internal_notes: e.target.value }))}
                placeholder="Internal notes about this listing..."
                rows={2}
                className="text-xs"
              />
              <p className="text-xs text-muted-foreground">Not visible to job seekers</p>
            </div>
            <div className="space-y-2">
              <Label>Benefits (optional)</Label>
              {benefits.map((b, i) => <div key={i} className="flex items-center gap-2 text-sm bg-muted px-3 py-1.5 rounded-md">{b}<button className="ml-auto text-muted-foreground hover:text-destructive" onClick={() => setBenefits(prev => prev.filter((_, idx) => idx !== i))}>×</button></div>)}
              <div className="flex gap-2">
                <Input value={newBen} onChange={e => setNewBen(e.target.value)} placeholder="Add benefit" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBen())} />
                <Button type="button" variant="outline" size="sm" onClick={addBen}><Plus className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createLoading}>{createLoading ? 'Creating...' : 'Create Job'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

const AdminPanel = () => {
  // Applications state (Career Fair - all applicants across all companies)
  const [allApplications, setAllApplications] = useState<any[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(true);
  const [applicationsSearch, setApplicationsSearch] = useState('');
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>('all');
  const [applicationCompanyFilter, setApplicationCompanyFilter] = useState<string>('all');

  const fetchAllApplications = async () => {
    setApplicationsLoading(true);
    try {
      const data = await adminApi.getAllApplications();
      setAllApplications((data.applications || []) as any[]);
    } catch {
      setAllApplications([]);
    }
    setApplicationsLoading(false);
  };

  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useAdminRole();

  // Resume feedback state
  const [feedbackRows, setFeedbackRows] = useState<FeedbackRow[]>([]);
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  // Edit dialog
  const [editRow, setEditRow] = useState<FeedbackRow | null>(null);
  const [editStrengths, setEditStrengths] = useState('');
  const [editImprovements, setEditImprovements] = useState('');
  const [editSuggestions, setEditSuggestions] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editScore, setEditScore] = useState('');
  const [editTradeSugg, setEditTradeSugg] = useState('');
  const [editSteps, setEditSteps] = useState('');
  const [saving, setSaving] = useState(false);

  // View dialog
  const [viewRow, setViewRow] = useState<FeedbackRow | null>(null);

  // Waitlist state
  const [tradeGrads, setTradeGrads] = useState<TradeGradRow[]>([]);
  const [tradeGradSearch, setTradeGradSearch] = useState('');
  const [tradeGradLoading, setTradeGradLoading] = useState(true);

  const [employers, setEmployers] = useState<EmployerRow[]>([]);
  const [employerSearch, setEmployerSearch] = useState('');
  const [employerLoading, setEmployerLoading] = useState(true);

  // Newsletter subscribers state
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; source: string; created_at: string }[]>([]);
  const [subscriberSearch, setSubscriberSearch] = useState('');
  const [subscriberLoading, setSubscriberLoading] = useState(true);

  // Audit log state
  const [auditLogs, setAuditLogs] = useState<AuditRow[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditLoading, setAuditLoading] = useState(true);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [auditEntityFilter, setAuditEntityFilter] = useState<string>('all');

  // Users state
  const [users, setUsers] = useState<UserListRow[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [userLoading, setUserLoading] = useState(true);
  const [userDetailModal, setUserDetailModal] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [togglingRoleId, setTogglingRoleId] = useState<string | null>(null);

  // Pending changes for batch save
  const [pendingChanges, setPendingChanges] = useState<Map<string, { creditUsed?: number; role?: string }>>(new Map());
  const [notifyOnSave, setNotifyOnSave] = useState(true);
  const [savingChanges, setSavingChanges] = useState(false);

  // Navigation guard — warn on browser close/refresh when unsaved changes exist
  const hasUnsavedChanges = pendingChanges.size > 0;

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Fetch functions
  const fetchFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const data = await adminApi.getFeedbackQueue();
      const items = (data.feedback || []).map((f: any) => ({
        ...f,
        strengths: f.strengths || [],
        improvements: f.improvements || [],
        suggestions: f.suggestions || [],
        overall_score: f.overall_score ?? null,
        trade_suggestions: f.trade_suggestions || [],
        actionable_steps: f.actionable_steps || [],
        user_email: f.user_email || f.user_id?.slice(0, 8) + '…',
        resume_file_name: f.resume_file_name || 'Unknown',
      }));
      setFeedbackRows(items);
    } catch {
      setFeedbackRows([]);
    }
    setFeedbackLoading(false);
  };

  const fetchTradeGrads = async () => {
    setTradeGradLoading(true);
    try {
      const data = await adminApi.getTradeGrads();
      setTradeGrads((data.tradeGrads || []) as TradeGradRow[]);
    } catch {
      setTradeGrads([]);
    }
    setTradeGradLoading(false);
  };

  const fetchEmployers = async () => {
    setEmployerLoading(true);
    try {
      const data = await adminApi.getEmployers();
      setEmployers((data.employers || []) as EmployerRow[]);
    } catch {
      setEmployers([]);
    }
    setEmployerLoading(false);
  };

  const fetchSubscribers = async () => {
    setSubscriberLoading(true);
    try {
      const data = await adminApi.getNewsletterSubscribers();
      setSubscribers(data.subscribers || []);
    } catch {
      setSubscribers([]);
    }
    setSubscriberLoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const data = await adminApi.getAuditLog();
      setAuditLogs((data.auditLogs || []) as AuditRow[]);
    } catch {
      setAuditLogs([]);
    }
    setAuditLoading(false);
  };

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const data = await adminApi.getUsers();
      setUsers((data.users || []) as UserListRow[]);
    } catch {
      setUsers([]);
    }
    setUserLoading(false);
  };

  const openUserDetail = async (userId: string) => {
    setUserDetailLoading(true);
    setUserDetailModal(null);
    try {
      const data = await adminApi.getUserDetail(userId);
      setUserDetailModal(data as UserDetail);
    } catch {
      toast.error('Failed to load user details.');
    }
    setUserDetailLoading(false);
  };

  const handleToggleAdminRole = async (userId: string, currentRole: string) => {
    setTogglingRoleId(userId);
    try {
      if (currentRole === 'admin') {
        await adminApi.removeAdminRole(userId);
        toast.success('Admin role revoked.');
      } else {
        await adminApi.addAdminRole(userId);
        toast.success('Admin role granted.');
      }
      fetchUsers();
      fetchAuditLogs();
      if (userDetailModal?.user.id === userId) {
        openUserDetail(userId);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update role.');
    }
    setTogglingRoleId(null);
  };

  const handleSetRole = async (userId: string, newRole: string) => {
    setPendingChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(userId) || {};
      const originalRole = users.find(u => u.id === userId)?.role || 'user';
      if (newRole === originalRole && !existing.creditUsed) {
        next.delete(userId);
      } else if (newRole === originalRole) {
        const { role: _, ...rest } = existing;
        if (Object.keys(rest).length === 0) next.delete(userId);
        else next.set(userId, rest);
      } else {
        next.set(userId, { ...existing, role: newRole });
      }
      return next;
    });
  };

  const handleSetCreditUsed = (userId: string, newUsed: number) => {
    setPendingChanges(prev => {
      const next = new Map(prev);
      const existing = next.get(userId) || {};
      const originalUsed = users.find(u => u.id === userId)?.ai_actions_used ?? 0;
      if (newUsed === originalUsed && !existing.role) {
        next.delete(userId);
      } else if (newUsed === originalUsed) {
        const { creditUsed: _, ...rest } = existing;
        if (Object.keys(rest).length === 0) next.delete(userId);
        else next.set(userId, rest);
      } else {
        next.set(userId, { ...existing, creditUsed: newUsed });
      }
      return next;
    });
  };

  const handleSaveAllChanges = async () => {
    if (pendingChanges.size === 0) return;
    setSavingChanges(true);
    let successCount = 0;
    let errorCount = 0;
    const entries = Array.from(pendingChanges.entries());
    for (const [userId, changes] of entries) {
      try {
        if (changes.role) {
          await adminApi.setUserRole(userId, changes.role);
        }
        if (changes.creditUsed !== undefined) {
          const result = await adminApi.setUserCredits(userId, changes.creditUsed, notifyOnSave);
          if (result?.emailError) {
            toast.warning(`Email failed for ${users.find(u => u.id === userId)?.email}: ${result.emailError}`);
          }
        }
        successCount++;
      } catch {
        errorCount++;
      }
    }
    setPendingChanges(new Map());
    setSavingChanges(false);
    fetchUsers();
    fetchAuditLogs();
    if (successCount > 0) toast.success(`Saved changes for ${successCount} user${successCount > 1 ? 's' : ''}.${notifyOnSave ? ' Notifications sent.' : ''}`);
    if (errorCount > 0) toast.error(`Failed to save changes for ${errorCount} user${errorCount > 1 ? 's' : ''}.`);
  };

  const handleDiscardChanges = () => {
    setPendingChanges(new Map());
    toast.info('Changes discarded.');
  };

  const exportUsers = () => {
    exportCSV(
      ['ID', 'Email', 'Full Name', 'Role', 'Resumes', 'AI Actions', 'Joined'],
      users.map(r => [
        r.id, r.email, r.full_name || '', r.role || 'user',
        String(r.resume_count ?? 0), String(r.ai_actions_used ?? 0),
        new Date(r.created_at).toLocaleString()
      ]),
      'users.csv'
    );
  };

  useEffect(() => {
    if (isAdmin) {
      fetchFeedback();
      fetchTradeGrads();
      fetchEmployers();
      fetchSubscribers();
      fetchAuditLogs();
      fetchUsers();
      fetchAllApplications();
    }
  }, [isAdmin]);

  // Handlers — audit logging is handled server-side

  const handleDownloadResume = async (resumeId: string, fileName: string) => {
    try {
      const response = await adminApi.downloadResume(resumeId);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName || 'resume.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download resume.');
    }
  };



  const openEdit = (row: FeedbackRow) => {
    setEditRow(row);
    setEditStrengths(row.strengths.join('\n'));
    setEditImprovements(row.improvements.join('\n'));
    setEditSuggestions(row.suggestions.join('\n'));
    setEditScore(String(row.overall_score ?? ''));
    setEditTradeSugg(row.trade_suggestions.join('\n'));
    setEditSteps(row.actionable_steps.join('\n'));
    setEditStatus(row.status || 'pending_review');
  };

  const handleSaveEdit = async () => {
    if (!editRow) return;
    setSaving(true);
    const updatedFields: Record<string, any> = {
      strengths: editStrengths.split('\n').filter(Boolean),
      improvements: editImprovements.split('\n').filter(Boolean),
      suggestions: editSuggestions.split('\n').filter(Boolean),
      overall_score: editScore ? parseInt(editScore) : null,
      trade_suggestions: editTradeSugg.split('\n').filter(Boolean),
      actionable_steps: editSteps.split('\n').filter(Boolean),
    };
    if (editStatus && editStatus !== editRow.status) {
      updatedFields.status = editStatus;
    }
    try {
      await adminApi.editFeedback(editRow.id, updatedFields);
      toast.success(editStatus === 'approved' ? 'Feedback approved — user notified.' : editStatus === 'rejected' ? 'Feedback rejected.' : 'Feedback updated.');
      setEditRow(null);
      fetchFeedback();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save.');
    }
    setSaving(false);
  };

  // CSV exports
  const exportResumeFeedback = () => {
    exportCSV(
      ['User', 'Resume', 'Score', 'Strengths', 'Improvements', 'Suggestions', 'Trade Suggestions', 'Actionable Steps', 'Status', 'Date'],
      feedbackRows.map(r => [
        r.user_email || '', r.resume_file_name || '', String(r.overall_score ?? ''),
        r.strengths.join('; '), r.improvements.join('; '), r.suggestions.join('; '),
        r.trade_suggestions.join('; '), r.actionable_steps.join('; '),
        r.status, new Date(r.created_at).toLocaleString()
      ]),
      'resume_feedback.csv'
    );
  };

  const exportTradeGrads = () => {
    exportCSV(
      ['Full Name', 'Email', 'Trade Program', 'State', 'City', 'Date'],
      tradeGrads.map(r => [r.full_name, r.email, r.trade_program, r.state, r.city, new Date(r.created_at).toLocaleString()]),
      'trade_grad_waitlist.csv'
    );
  };

  const exportEmployers = () => {
    exportCSV(
      ['Full Name', 'Job Title', 'Company Email', 'Trades Hiring For', 'Hiring Volume', 'State', 'City', 'Date'],
      employers.map(r => [r.full_name, r.job_title, r.company_email, r.trades_hiring_for, r.hiring_volume, r.state, r.city, new Date(r.created_at).toLocaleString()]),
      'employer_waitlist.csv'
    );
  };



  const handleDeleteTradeGrad = async (id: string) => {
    try {
      await adminApi.deleteTradeGrad(id);
      setTradeGrads(prev => prev.filter(r => r.id !== id));
      toast.success('Waitlist entry deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleDeleteEmployer = async (id: string) => {
    try {
      await adminApi.deleteEmployer(id);
      setEmployers(prev => prev.filter(r => r.id !== id));
      toast.success('Waitlist entry deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const handleDeleteSubscriber = async (id: string) => {
    try {
      await adminApi.deleteSubscriber(id);
      setSubscribers(prev => prev.filter(r => r.id !== id));
      toast.success('Subscriber removed.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  const exportSubscribers = async () => {
    try {
      const response = await adminApi.exportSubscribersCSV();
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newsletter_subscribers.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Export failed.');
    }
  };

  // Filtered data
  const filteredFeedback = feedbackRows.filter(r => matchesSearch(r, feedbackSearch));
  const filteredTradeGrads = tradeGrads.filter(r => matchesSearch(r, tradeGradSearch));
  const filteredEmployers = employers.filter(r => matchesSearch(r, employerSearch));
  const filteredSubscribers = subscribers.filter(r => matchesSearch(r, subscriberSearch));
  const filteredAuditLogs = auditLogs.filter(r => {
    if (auditEntityFilter !== 'all' && r.entity_type !== auditEntityFilter) return false;
    return matchesSearch(r, auditSearch);
  });
  const filteredUsers = users.filter(r => matchesSearch(r, userSearch));
  const auditEntityTypes = Array.from(new Set(auditLogs.map(r => r.entity_type)));

  // Filtered applications
  const filteredApplications = allApplications.filter(app => {
    if (applicationStatusFilter !== 'all' && app.status !== applicationStatusFilter) return false;
    if (applicationCompanyFilter !== 'all' && app.company_name !== applicationCompanyFilter) return false;
    if (applicationsSearch) {
      const q = applicationsSearch.toLowerCase();
      if (!(app.applicant_name || '').toLowerCase().includes(q) &&
          !(app.applicant_email || '').toLowerCase().includes(q) &&
          !(app.job_title || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user || !isAdmin) return <Navigate to="/dashboard" replace />;

  const pendingCount = feedbackRows.filter(r => r.status === 'pending_review').length;

  const refreshAll = () => {
    fetchFeedback();
    fetchTradeGrads();
    fetchEmployers();
    fetchSubscribers();
    fetchAuditLogs();
    fetchUsers();
    fetchAllApplications();
    toast.success('Data refreshed.');
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Manage submissions, waitlists, and feedback.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={refreshAll}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Pending Reviews</p>
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Waitlist</p>
              <p className="text-2xl font-bold text-foreground">{tradeGrads.length + employers.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Users</p>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">
                {users.filter(u => u.role === 'admin').length} admin · {users.filter(u => u.role === 'employer').length} employer · {users.filter(u => u.role === 'employee').length} employee
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="resume" className="w-full">
          <TabsList className="flex w-full overflow-x-auto">
            <TabsTrigger value="resume">Reviews ({feedbackRows.length})</TabsTrigger>
            <TabsTrigger value="trade_grads">Trade Grads ({tradeGrads.length})</TabsTrigger>
            <TabsTrigger value="employers">Employers ({employers.length})</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers ({subscribers.length})</TabsTrigger>
            <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
            <TabsTrigger value="cf_companies">Companies</TabsTrigger>
            <TabsTrigger value="cf_jobs">Job Listings</TabsTrigger>
            <TabsTrigger value="cf_applications">Applications ({allApplications.length})</TabsTrigger>
            <TabsTrigger value="employer_requests">Employer Requests</TabsTrigger>
          </TabsList>

          {/* Resume Feedback Tab */}
          <TabsContent value="resume">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading">Resume Feedback Submissions</CardTitle>
                <Button variant="outline" size="sm" onClick={exportResumeFeedback}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={feedbackSearch} onChange={e => setFeedbackSearch(e.target.value)} className="max-w-xs" />
                </div>
                {feedbackLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredFeedback.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No submissions found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Resume</TableHead>
                          <TableHead>Score</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredFeedback.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="font-mono text-xs">{row.user_email}</TableCell>
                            <TableCell className="text-sm max-w-[120px] truncate">{row.resume_file_name}</TableCell>
                            <TableCell className="text-sm">{row.overall_score != null ? `${row.overall_score}/10` : '—'}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(row.created_at).toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="sm" onClick={() => handleDownloadResume(row.resume_id, row.resume_file_name || 'resume')} title="Download resume">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => setViewRow(row)}>
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => openEdit(row)}>
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trade Grad Waitlist Tab */}
          <TabsContent value="trade_grads">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading">Trade Grad Waitlist</CardTitle>
                <Button variant="outline" size="sm" onClick={exportTradeGrads}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={tradeGradSearch} onChange={e => setTradeGradSearch(e.target.value)} className="max-w-xs" />
                </div>
                {tradeGradLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredTradeGrads.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No entries found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Trade Program</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTradeGrads.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm">{row.full_name}</TableCell>
                            <TableCell className="text-sm">{row.email}</TableCell>
                            <TableCell className="text-sm">{row.trade_program}</TableCell>
                            <TableCell className="text-sm">{row.state}</TableCell>
                            <TableCell className="text-sm">{row.city}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteTradeGrad(row.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employer Waitlist Tab */}
          <TabsContent value="employers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading">Employer Waitlist</CardTitle>
                <Button variant="outline" size="sm" onClick={exportEmployers}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={employerSearch} onChange={e => setEmployerSearch(e.target.value)} className="max-w-xs" />
                </div>
                {employerLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredEmployers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No entries found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Job Title</TableHead>
                          <TableHead>Company Email</TableHead>
                          <TableHead>Trades Hiring For</TableHead>
                          <TableHead>Hiring Volume</TableHead>
                          <TableHead>State</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredEmployers.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm">{row.full_name}</TableCell>
                            <TableCell className="text-sm">{row.job_title}</TableCell>
                            <TableCell className="text-sm">{row.company_email}</TableCell>
                            <TableCell className="text-sm">{row.trades_hiring_for}</TableCell>
                            <TableCell className="text-sm">{row.hiring_volume}</TableCell>
                            <TableCell className="text-sm">{row.state}</TableCell>
                            <TableCell className="text-sm">{row.city}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteEmployer(row.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Newsletter Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading">Newsletter Subscribers</CardTitle>
                <Button variant="outline" size="sm" onClick={exportSubscribers}>
                  <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={subscriberSearch} onChange={e => setSubscriberSearch(e.target.value)} className="max-w-xs" />
                </div>
                {subscriberLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredSubscribers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No subscribers yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSubscribers.map(row => (
                          <TableRow key={row.id}>
                            <TableCell className="text-sm">{row.email}</TableCell>
                            <TableCell className="text-sm capitalize">{row.source}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => handleDeleteSubscriber(row.id)} className="text-destructive hover:text-destructive">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <Users className="h-4 w-4" /> User Management
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={async () => {
                    try {
                      const result = await adminApi.syncUsers();
                      toast.success(`Synced ${(result as any).synced} new users from Clerk (${(result as any).total} total)`);
                      fetchUsers();
                    } catch { toast.error('Sync failed'); }
                  }}>
                    Sync from Clerk
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportUsers}>
                    <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search users..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="max-w-xs" />
                </div>
                {userLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Credit Limit</TableHead>
                          <TableHead>AI Credits Used</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.map(row => (
                          <TableRow key={row.id} className={pendingChanges.has(row.id) ? 'bg-amber-50 dark:bg-amber-950/20' : undefined}>
                            <TableCell className="text-sm">{row.full_name || '—'}</TableCell>
                            <TableCell className="text-sm">{row.email}</TableCell>
                            <TableCell>
                              <Select
                                value={pendingChanges.get(row.id)?.role || row.role || 'user'}
                                onValueChange={v => handleSetRole(row.id, v)}
                                disabled={row.id === user?.id}
                              >
                                <SelectTrigger className={`h-7 w-[120px] text-xs ${pendingChanges.get(row.id)?.role ? 'border-amber-400' : ''}`}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">User</SelectItem>
                                  <SelectItem value="employee">Employee</SelectItem>
                                  <SelectItem value="employer">Employer</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm font-mono">{row.credit_limit ?? 3}</span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleSetCreditUsed(row.id, Math.max(0, (pendingChanges.get(row.id)?.creditUsed ?? row.ai_actions_used ?? 0) - 1))}
                                  disabled={(pendingChanges.get(row.id)?.creditUsed ?? row.ai_actions_used ?? 0) <= 0}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className={`text-sm font-mono w-6 text-center ${pendingChanges.get(row.id)?.creditUsed !== undefined ? 'text-amber-600 font-bold' : ''}`}>
                                  {pendingChanges.get(row.id)?.creditUsed ?? row.ai_actions_used ?? 0}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={() => handleSetCreditUsed(row.id, (pendingChanges.get(row.id)?.creditUsed ?? row.ai_actions_used ?? 0) + 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs text-muted-foreground ml-1">/ {row.credit_limit ?? 3}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="sm" onClick={() => openUserDetail(row.id)} title="View details">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Save Changes Bar */}
                {pendingChanges.size > 0 && (
                  <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                        {pendingChanges.size} unsaved change{pendingChanges.size > 1 ? 's' : ''}
                      </p>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="notify-users"
                          checked={notifyOnSave}
                          onCheckedChange={(checked) => setNotifyOnSave(checked === true)}
                        />
                        <label htmlFor="notify-users" className="text-xs text-amber-700 dark:text-amber-300 cursor-pointer flex items-center gap-1">
                          <Bell className="h-3 w-3" /> Notify users via email
                        </label>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={handleDiscardChanges} disabled={savingChanges}>
                        Discard
                      </Button>
                      <Button size="sm" onClick={handleSaveAllChanges} disabled={savingChanges}>
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {savingChanges ? 'Saving...' : 'Save All Changes'}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-heading flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" /> Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search..." value={auditSearch} onChange={e => setAuditSearch(e.target.value)} className="max-w-xs" />
                  <Select value={auditEntityFilter} onValueChange={setAuditEntityFilter}>
                    <SelectTrigger className="h-9 w-[160px] text-xs">
                      <SelectValue placeholder="All entities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All entities</SelectItem>
                      {auditEntityTypes.map(t => (
                        <SelectItem key={t} value={t}>{t.replace(/_/g, ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {auditLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No audit records.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-8"></TableHead>
                          <TableHead>Actor</TableHead>
                          <TableHead>Entity</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAuditLogs.map(row => (
                          <>
                            <TableRow key={row.id} className="cursor-pointer" onClick={() => setExpandedAuditId(expandedAuditId === row.id ? null : row.id)}>
                              <TableCell className="w-8 px-2">
                                {(row.before_json || row.after_json) && (
                                  expandedAuditId === row.id
                                    ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                    : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-xs">{row.actor_user_id.slice(0, 8)}…</TableCell>
                              <TableCell className="text-sm">{row.entity_type} / {row.entity_id.slice(0, 8)}…</TableCell>
                              <TableCell>
                                <Badge variant="outline">{row.action}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground">{new Date(row.created_at).toLocaleString()}</TableCell>
                            </TableRow>
                            {expandedAuditId === row.id && (row.before_json || row.after_json) && (
                              <TableRow key={`${row.id}-detail`}>
                                <TableCell colSpan={5} className="bg-muted/50 p-4">
                                  <div className="grid grid-cols-2 gap-4 text-xs">
                                    <div>
                                      <p className="font-medium mb-1 text-muted-foreground">Before</p>
                                      <pre className="whitespace-pre-wrap bg-background rounded p-2 border text-xs overflow-x-auto">
                                        {row.before_json ? JSON.stringify(typeof row.before_json === 'string' ? JSON.parse(row.before_json) : row.before_json, null, 2) : '—'}
                                      </pre>
                                    </div>
                                    <div>
                                      <p className="font-medium mb-1 text-muted-foreground">After</p>
                                      <pre className="whitespace-pre-wrap bg-background rounded p-2 border text-xs overflow-x-auto">
                                        {row.after_json ? JSON.stringify(typeof row.after_json === 'string' ? JSON.parse(row.after_json) : row.after_json, null, 2) : '—'}
                                      </pre>
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Career Fair Companies Tab */}
          <TabsContent value="cf_companies">
            <CareerFairCompaniesTab />
          </TabsContent>

          {/* Career Fair Jobs Tab */}
          <TabsContent value="cf_jobs">
            <CareerFairJobsTab />
          </TabsContent>

          {/* Career Fair Applications Tab - All applicants across all companies */}
          <TabsContent value="cf_applications">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base font-heading">All Job Applications</CardTitle>
                <Button variant="outline" size="sm" onClick={fetchAllApplications}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by applicant name or email..."
                      value={applicationsSearch}
                      onChange={e => setApplicationsSearch(e.target.value)}
                      className="max-w-xs"
                    />
                  </div>
                  <Select value={applicationStatusFilter} onValueChange={setApplicationStatusFilter}>
                    <SelectTrigger className="w-full sm:max-w-[180px]">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="submitted">New</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="interview">Interview</SelectItem>
                      <SelectItem value="offered">Offered</SelectItem>
                      <SelectItem value="hired">Hired</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={applicationCompanyFilter} onValueChange={setApplicationCompanyFilter}>
                    <SelectTrigger className="w-full sm:max-w-[200px]">
                      <SelectValue placeholder="All companies" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All companies</SelectItem>
                      {Array.from(new Set(allApplications.map(a => a.company_name).filter(Boolean))).map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {applicationsLoading ? (
                  <div className="space-y-3 py-4">
                    {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : filteredApplications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {allApplications.length === 0 ? 'No applications yet.' : 'No applications match your filters.'}
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Job</TableHead>
                          <TableHead>Company</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredApplications.map(app => (
                          <TableRow key={app.id}>
                            <TableCell>
                              <div>
                                <p className="text-sm font-medium">{app.applicant_name || '—'}</p>
                                {app.applicant_email && (
                                  <p className="text-xs text-muted-foreground">{app.applicant_email}</p>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm max-w-[180px] truncate">{app.job_title || '—'}</TableCell>
                            <TableCell className="text-sm">{app.company_name || '—'}</TableCell>
                            <TableCell>
                              <Badge className={
                                app.status === 'hired' ? 'bg-green-100 text-green-800' :
                                app.status === 'offered' ? 'bg-blue-100 text-blue-800' :
                                app.status === 'interview' ? 'bg-purple-100 text-purple-800' :
                                app.status === 'shortlisted' ? 'bg-cyan-100 text-cyan-800' :
                                app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                app.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {app.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {new Date(app.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-right">
                              {app.resume_id && (
                                <Button variant="ghost" size="sm" title="View resume">
                                  <FileText className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {app.cover_letter && (
                                <Button variant="ghost" size="sm" title="View cover letter">
                                  <Mail className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Employer Access Requests Tab */}
          <TabsContent value="employer_requests">
            <EmployerAccessRequestsTab />
          </TabsContent>
        </Tabs>
        <Dialog open={!!viewRow} onOpenChange={() => setViewRow(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Feedback Details</DialogTitle>
            </DialogHeader>
            {viewRow && (
              <div className="space-y-4 text-sm">
                {viewRow.overall_score && (
                  <div><span className="font-medium">Overall Score:</span> {viewRow.overall_score}/10</div>
                )}
                <div>
                  <p className="font-medium mb-1">Strengths</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    {viewRow.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Areas for Improvement</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    {viewRow.improvements.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                <div>
                  <p className="font-medium mb-1">Suggestions</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                    {viewRow.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
                {viewRow.trade_suggestions.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Trade-Specific Suggestions</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {viewRow.trade_suggestions.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
                {viewRow.actionable_steps.length > 0 && (
                  <div>
                    <p className="font-medium mb-1">Actionable Steps</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-muted-foreground">
                      {viewRow.actionable_steps.map((s, i) => <li key={i}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit Feedback Dialog */}
        <Dialog open={!!editRow} onOpenChange={() => setEditRow(null)}>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading">Edit Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Overall Score (1-10)</label>
                <Input type="number" min="1" max="10" value={editScore} onChange={e => setEditScore(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Strengths (one per line)</label>
                <Textarea rows={3} value={editStrengths} onChange={e => setEditStrengths(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Areas for Improvement (one per line)</label>
                <Textarea rows={3} value={editImprovements} onChange={e => setEditImprovements(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Suggestions (one per line)</label>
                <Textarea rows={3} value={editSuggestions} onChange={e => setEditSuggestions(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Trade-Specific Suggestions (one per line)</label>
                <Textarea rows={3} value={editTradeSugg} onChange={e => setEditTradeSugg(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Actionable Steps (one per line)</label>
                <Textarea rows={3} value={editSteps} onChange={e => setEditSteps(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditRow(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Detail Modal */}
        <Dialog open={!!userDetailModal || userDetailLoading} onOpenChange={() => { setUserDetailModal(null); setUserDetailLoading(false); }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <Users className="h-4 w-4" /> User Details
              </DialogTitle>
            </DialogHeader>
            {userDetailLoading ? (
              <div className="space-y-4 py-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : userDetailModal ? (
              <div className="space-y-5 text-sm">
                {/* Profile */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{userDetailModal.user.full_name || 'No Name'}</p>
                    <p className="text-muted-foreground">{userDetailModal.user.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={userDetailModal.user.role === 'admin' ? 'default' : userDetailModal.user.role === 'employer' ? 'outline' : 'secondary'}>
                        {userDetailModal.user.role || 'user'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Joined {new Date(userDetailModal.user.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Role & Credits Management */}
                <div className="grid grid-cols-2 gap-4 p-3 rounded border bg-muted/30">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Role</p>
                    <Select
                      value={pendingChanges.get(userDetailModal.user.id)?.role || userDetailModal.user.role || 'user'}
                      onValueChange={v => handleSetRole(userDetailModal.user.id, v)}
                      disabled={userDetailModal.user.id === user?.id}
                    >
                      <SelectTrigger className={`h-8 text-xs ${pendingChanges.get(userDetailModal.user.id)?.role ? 'border-amber-400' : ''}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="employer">Employer</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">Credit Limit</p>
                    <p className="text-sm font-mono font-bold">{userDetailModal.user.credit_limit ?? 3}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1.5">AI Credits Used</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSetCreditUsed(userDetailModal.user.id, Math.max(0, (pendingChanges.get(userDetailModal.user.id)?.creditUsed ?? userDetailModal.user.ai_actions_used ?? 0) - 1))}
                        disabled={(pendingChanges.get(userDetailModal.user.id)?.creditUsed ?? userDetailModal.user.ai_actions_used ?? 0) <= 0}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className={`text-sm font-mono font-bold w-8 text-center ${pendingChanges.get(userDetailModal.user.id)?.creditUsed !== undefined ? 'text-amber-600' : ''}`}>
                        {pendingChanges.get(userDetailModal.user.id)?.creditUsed ?? userDetailModal.user.ai_actions_used ?? 0}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleSetCreditUsed(userDetailModal.user.id, (pendingChanges.get(userDetailModal.user.id)?.creditUsed ?? userDetailModal.user.ai_actions_used ?? 0) + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <span className="text-xs text-muted-foreground">/ {userDetailModal.user.credit_limit ?? 3}</span>
                    </div>
                  </div>
                </div>

                {/* Resumes */}
                <div>
                  <p className="font-medium mb-2 flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Resumes ({userDetailModal.resumes.length})</p>
                  {userDetailModal.resumes.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No resumes uploaded.</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetailModal.resumes.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                          <div>
                            <p className="text-sm font-medium">{r.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {r.trade_program && <span>{r.trade_program} · </span>}
                              {(r.file_size / 1024).toFixed(0)} KB · {new Date(r.created_at).toLocaleDateString()}
                              {r.is_active ? ' · Active' : ''}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => handleDownloadResume(r.id, r.file_name)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Feedback */}
                <div>
                  <p className="font-medium mb-2">Resume Feedback ({userDetailModal.feedback.length})</p>
                  {userDetailModal.feedback.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No feedback generated.</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetailModal.feedback.map(f => (
                        <div key={f.id} className="p-2 rounded border bg-muted/30">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={f.status === 'approved' ? 'default' : f.status === 'rejected' ? 'destructive' : 'secondary'}>
                                {f.status === 'approved' ? 'Approved' : f.status === 'rejected' ? 'Rejected' : 'Pending'}
                              </Badge>
                              {f.overall_score && <span className="text-xs font-medium">Score: {f.overall_score}/10</span>}
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</span>
                          </div>
                          {f.strengths.length > 0 && (
                            <div className="mt-1">
                              <p className="text-xs font-medium text-muted-foreground">Strengths:</p>
                              <ul className="list-disc pl-4 text-xs text-muted-foreground">
                                {f.strengths.slice(0, 3).map((s, i) => <li key={i}>{s}</li>)}
                                {f.strengths.length > 3 && <li>+{f.strengths.length - 3} more</li>}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Interview Questions */}
                <div>
                  <p className="font-medium mb-2">Interview Questions ({userDetailModal.questions.length})</p>
                  {userDetailModal.questions.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No questions generated.</p>
                  ) : (
                    <div className="space-y-2">
                      {userDetailModal.questions.map(q => (
                        <div key={q.id} className="p-2 rounded border bg-muted/30">
                          <p className="text-xs font-medium truncate">{q.job_description.slice(0, 100)}…</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {q.technical.length} technical · {q.behavioral.length} behavioral · {q.situational.length} situational
                            <span className="ml-2">{new Date(q.created_at).toLocaleDateString()}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Usage */}
                <div>
                  <p className="font-medium mb-2">AI Usage ({userDetailModal.user.ai_actions_used ?? 0}/{userDetailModal.user.credit_limit ?? 3} actions)</p>
                  {userDetailModal.aiUsage.length === 0 ? (
                    <p className="text-muted-foreground text-xs">No AI actions used.</p>
                  ) : (
                    <div className="space-y-1">
                      {userDetailModal.aiUsage.map(a => (
                        <div key={a.id} className="flex items-center justify-between text-xs p-1.5 rounded border bg-muted/30">
                          <Badge variant="outline" className="text-xs">{a.action_type.replace(/_/g, ' ')}</Badge>
                          <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waitlist Cross-Reference */}
                {(userDetailModal.waitlistMatch.tradeGrad || userDetailModal.waitlistMatch.employer) && (
                  <div>
                    <p className="font-medium mb-2 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> Waitlist Match</p>
                    {userDetailModal.waitlistMatch.tradeGrad && (
                      <div className="p-2 rounded border bg-blue-500/5 text-xs">
                        <Badge variant="outline" className="mb-1">Trade Grad</Badge>
                        <p>{userDetailModal.waitlistMatch.tradeGrad.full_name} — {userDetailModal.waitlistMatch.tradeGrad.trade_program} — {userDetailModal.waitlistMatch.tradeGrad.city}, {userDetailModal.waitlistMatch.tradeGrad.state}</p>
                      </div>
                    )}
                    {userDetailModal.waitlistMatch.employer && (
                      <div className="p-2 rounded border bg-green-500/5 text-xs mt-1">
                        <Badge variant="outline" className="mb-1">Employer</Badge>
                        <p>{userDetailModal.waitlistMatch.employer.full_name} — {userDetailModal.waitlistMatch.employer.trades_hiring_for} — {userDetailModal.waitlistMatch.employer.city}, {userDetailModal.waitlistMatch.employer.state}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>

      {/* Unsaved changes sticky banner at top when changes exist */}
      {hasUnsavedChanges && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
          <p className="text-sm font-medium">
            ⚠ You have {pendingChanges.size} unsaved change{pendingChanges.size !== 1 ? 's' : ''} — remember to save before leaving!
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-white hover:bg-amber-600" onClick={handleDiscardChanges}>
              Discard
            </Button>
            <Button size="sm" className="bg-white text-amber-700 hover:bg-amber-50" onClick={handleSaveAllChanges} disabled={savingChanges}>
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {savingChanges ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default AdminPanel;

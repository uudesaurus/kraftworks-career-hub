import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/DashboardLayout';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { request } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, Check, ChevronRight } from 'lucide-react';
import { useClerk } from '@clerk/clerk-react';

const TRADES = [
  { value: 'electrician', label: 'Electrician', desc: 'Electrical systems & installation' },
  { value: 'plumber', label: 'Plumber', desc: 'Pipes, fixtures & water systems' },
  { value: 'welder', label: 'Welder', desc: 'Metal joining & fabrication' },
  { value: 'hvac', label: 'HVAC Tech', desc: 'Heating, cooling & ventilation' },
  { value: 'fabricator', label: 'Fabricator', desc: 'Metal & material shaping' },
  { value: 'other', label: 'Other Trade', desc: 'A trade not listed above' },
];

const WORK_TYPES = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'apprenticeship', label: 'Apprenticeship' },
];

export default function ProfileSetup() {
  const { user } = useAuth();
  const { user: clerkUser } = useClerk();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || '');
  const [phone, setPhone] = useState('');
  const [tradeType, setTradeType] = useState('');
  const [tradeOther, setTradeOther] = useState('');
  const [workTypes, setWorkTypes] = useState<string[]>([]);
  const [marketingConsent, setMarketingConsent] = useState(false);

  const canNext1 = fullName.trim().length >= 2 && phone.trim().length >= 7;
  const canNext2 = tradeType.length > 0 && (tradeType !== 'other' || tradeOther.trim().length > 0);
  const canSubmit = workTypes.length > 0;

  const toggleWorkType = (val: string) => {
    setWorkTypes(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Sync to Clerk metadata first (fire-and-forget is fine here — backend is source of truth)
      if (clerkUser) {
        clerkUser.update({
          firstName: fullName.trim().split(' ')[0],
          lastName: fullName.trim().split(' ').slice(1).join(' ') || undefined,
          publicMetadata: {
            ...clerkUser.publicMetadata,
            trade_type: tradeType === 'other' ? tradeOther.trim() : tradeType,
            work_types: workTypes,
          },
        }).catch((clerkErr: any) => console.warn('Clerk metadata sync failed (non-critical):', clerkErr));
      }

      // Save to backend — this is the critical operation
      await request('/api/user/profile-setup', {
        method: 'POST',
        body: {
          full_name: fullName.trim(),
          phone: phone.trim(),
          trade_type: tradeType === 'other' ? tradeOther.trim() : tradeType,
          work_types: workTypes,
          marketing_consent: marketingConsent,
        },
      });

      toast.success('Profile saved!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save profile');
    }
    setSubmitting(false);
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto py-8">
        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            {/* Progress */}
            <div className="flex items-center justify-center gap-2 mb-4">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {step > s ? <Check className="h-3.5 w-3.5" /> : s}
                  </div>
                  {s < 3 && <div className={`h-0.5 w-8 transition-colors ${step > s ? 'bg-primary' : 'bg-muted'}`} />}
                </div>
              ))}
            </div>
            <CardTitle className="text-xl font-heading">
              {step === 1 ? 'Welcome to Kraftworks!' : step === 2 ? 'What\'s your trade?' : 'What type of work?'}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {step === 1
                ? 'Tell us a bit about yourself to get started'
                : step === 2
                ? 'Select the trade you work in or are training for'
                : 'Choose the work arrangements you\'re looking for'}
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit}>
              {/* Step 1: Basic info */}
              {step === 1 && (
                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="John Martinez"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="(720) 555-1234"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Employers may contact you about job opportunities
                    </p>
                  </div>
                  <Button
                    type="button"
                    className="w-full h-11"
                    disabled={!canNext1}
                    onClick={() => setStep(2)}
                  >
                    Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Step 2: Trade type */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {TRADES.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTradeType(t.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-colors ${tradeType === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${tradeType === t.value ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                          {tradeType === t.value && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  {tradeType === 'other' && (
                    <div className="space-y-1.5">
                      <Label htmlFor="tradeOther">Describe your trade</Label>
                      <Input
                        id="tradeOther"
                        value={tradeOther}
                        onChange={e => setTradeOther(e.target.value)}
                        placeholder="e.g. Sheet Metal Worker"
                        className="h-11"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button type="button" className="flex-1 h-11" disabled={!canNext2} onClick={() => setStep(3)}>
                      Continue <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Work type */}
              {step === 3 && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 gap-2">
                    {WORK_TYPES.map(w => (
                      <button
                        key={w.value}
                        type="button"
                        onClick={() => toggleWorkType(w.value)}
                        className={`p-3.5 rounded-lg border text-center transition-colors ${workTypes.includes(w.value) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border hover:bg-muted/50'}`}
                      >
                        <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center mx-auto mb-2 transition-colors ${workTypes.includes(w.value) ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>
                          {workTypes.includes(w.value) && <Check className="h-3 w-3 text-primary-foreground" />}
                        </div>
                        <p className="text-sm font-medium">{w.label}</p>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="marketingConsent"
                        checked={marketingConsent}
                        onChange={e => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-input accent-primary"
                      />
                      <Label htmlFor="marketingConsent" className="text-sm text-muted-foreground cursor-pointer leading-snug">
                        Send me job alerts and updates from Kraftworks. I can unsubscribe anytime.
                      </Label>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="submit" className="flex-1 h-11" disabled={!canSubmit || submitting}>
                      {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving... </> : 'Complete Setup'}
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    You can update your profile anytime in{' '}
                    <button type="button" onClick={() => navigate('/dashboard')} className="underline hover:text-foreground">
                      Settings
                    </button>
                    .
                  </p>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

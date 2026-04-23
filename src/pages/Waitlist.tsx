import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { publicApi } from '@/lib/api';
import { toast } from 'sonner';
import { CheckCircle, Users, Briefcase } from 'lucide-react';

type UserType = 'trade_grad' | 'employer';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland',
  'Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina',
  'South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'
];

const TRADE_PROGRAMS = ['Electrician', 'HVAC', 'Welding', 'Plumbing', 'Carpentry', 'Other'];
const HIRING_VOLUMES = ['1-5', '6-15', '16-30', '31-50', '50+'];

const Waitlist = () => {
  const [searchParams] = useSearchParams();
  const [userType, setUserType] = useState<UserType>('trade_grad');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Read mode from URL query param (?mode=trade_grad or ?mode=employer)
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'employer' || mode === 'trade_grad') {
      setUserType(mode);
    }
  }, [searchParams]);

  // Trade grad fields
  const [gradName, setGradName] = useState('');
  const [gradEmail, setGradEmail] = useState('');
  const [tradeProg, setTradeProg] = useState('');
  const [gradState, setGradState] = useState('');
  const [gradCity, setGradCity] = useState('');
  const [gradConsent, setGradConsent] = useState(false);

  // Employer fields
  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empTrades, setEmpTrades] = useState('');
  const [empVolume, setEmpVolume] = useState('');
  const [empState, setEmpState] = useState('');
  const [empCity, setEmpCity] = useState('');
  const [empConsent, setEmpConsent] = useState(false);

  const handleTradeGradSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradConsent) { toast.error('Please accept the consent checkbox.'); return; }
    setSubmitting(true);
    try {
      await publicApi.submitTradeGradWaitlist({
        full_name: gradName.trim(),
        email: gradEmail.trim(),
        trade_program: tradeProg,
        state: gradState,
        city: gradCity.trim(),
        consent: true,
      });
      setSubmitted(true);
      toast.success("You're on the waitlist!");
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  const handleEmployerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empConsent) { toast.error('Please accept the consent checkbox.'); return; }
    setSubmitting(true);
    try {
      await publicApi.submitEmployerWaitlist({
        full_name: empName.trim(),
        company_email: empEmail.trim(),
        job_title: empTitle.trim(),
        trades_hiring_for: empTrades.trim(),
        hiring_volume: empVolume,
        state: empState,
        city: empCity.trim(),
        consent: true,
      });
      setSubmitted(true);
      toast.success("You're on the waitlist!");
    } catch {
      toast.error('Something went wrong. Please try again.');
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <PageLayout>
        <section className="py-20 sm:py-28">
          <div className="max-w-lg mx-auto px-6 text-center">
            <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-3">You're on the list!</h1>
            <p className="text-muted-foreground mb-2">
              Thanks{userType === 'trade_grad' && gradName ? `, ${gradName.split(' ')[0]}` : userType === 'employer' && empName ? `, ${empName.split(' ')[0]}` : ''}! We've added you to the waitlist.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Check your email for a confirmation. We'll be in touch with updates about the Digital Career Fair.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/">Back to Home</Link>
              </Button>
              <Button asChild>
                <Link to="/career-fair">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-16 sm:py-20">
        <div className="max-w-xl mx-auto px-6">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground mb-3">
              Join the Career Fair Waitlist
            </h1>
            <p className="text-muted-foreground">
              Sign up to be notified when the Kraftworks Digital Career Fair launches.
            </p>
          </div>

          {/* Toggle */}
          <div className="flex gap-3 mb-8">
            <Button
              variant={userType === 'trade_grad' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('trade_grad')}
            >
              <Users className="mr-2 h-4 w-4" />
              I am a Trade Grad
            </Button>
            <Button
              variant={userType === 'employer' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setUserType('employer')}
            >
              <Briefcase className="mr-2 h-4 w-4" />
              I am an Employer
            </Button>
          </div>

          {userType === 'trade_grad' ? (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Trade Graduate Registration</CardTitle>
                <CardDescription>Tell us about yourself and your trade background.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleTradeGradSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="grad-name">Full Name</Label>
                    <Input id="grad-name" required value={gradName} onChange={e => setGradName(e.target.value)} placeholder="John Doe" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="grad-email">Email</Label>
                    <Input id="grad-email" type="email" required value={gradEmail} onChange={e => setGradEmail(e.target.value)} placeholder="john@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Trade Program</Label>
                    <Select value={tradeProg} onValueChange={setTradeProg} required>
                      <SelectTrigger><SelectValue placeholder="Select trade" /></SelectTrigger>
                      <SelectContent>
                        {TRADE_PROGRAMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={gradState} onValueChange={setGradState} required>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grad-city">City</Label>
                      <Input id="grad-city" required value={gradCity} onChange={e => setGradCity(e.target.value)} placeholder="City" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox id="grad-consent" checked={gradConsent} onCheckedChange={(c) => setGradConsent(c === true)} />
                    <label htmlFor="grad-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to join the Kraftworks Digital Career Fair waitlist and consent to be contacted about event updates, career opportunities, and related resources. I agree to Kraftworks{' '}
                      <Link to="/terms-of-service" className="text-primary underline" target="_blank">terms & conditions</Link>{' '}and{' '}
                      <Link to="/privacy-policy" className="text-primary underline" target="_blank">privacy policy</Link>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting || !tradeProg || !gradState}>
                    {submitting ? 'Submitting...' : 'Join Waitlist'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-lg">Employer Registration</CardTitle>
                <CardDescription>Tell us about your hiring needs.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleEmployerSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emp-name">Full Name</Label>
                    <Input id="emp-name" required value={empName} onChange={e => setEmpName(e.target.value)} placeholder="Jane Smith" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-title">Job Title</Label>
                    <Input id="emp-title" required value={empTitle} onChange={e => setEmpTitle(e.target.value)} placeholder="HR Manager" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-email">Company Email</Label>
                    <Input id="emp-email" type="email" required value={empEmail} onChange={e => setEmpEmail(e.target.value)} placeholder="jane@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emp-trades">Trades Hiring For</Label>
                    <Input id="emp-trades" required value={empTrades} onChange={e => setEmpTrades(e.target.value)} placeholder="Electricians, HVAC Technicians" />
                  </div>
                  <div className="space-y-2">
                    <Label>Hiring Volume</Label>
                    <Select value={empVolume} onValueChange={setEmpVolume} required>
                      <SelectTrigger><SelectValue placeholder="How many hires?" /></SelectTrigger>
                      <SelectContent>
                        {HIRING_VOLUMES.map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Select value={empState} onValueChange={setEmpState} required>
                        <SelectTrigger><SelectValue placeholder="State" /></SelectTrigger>
                        <SelectContent>
                          {US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emp-city">City</Label>
                      <Input id="emp-city" required value={empCity} onChange={e => setEmpCity(e.target.value)} placeholder="City" />
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-2">
                    <Checkbox id="emp-consent" checked={empConsent} onCheckedChange={(c) => setEmpConsent(c === true)} />
                    <label htmlFor="emp-consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      I agree to join the Kraftworks Digital Career Fair waitlist and consent to be contacted about event updates and other related opportunities. I understand Kraftworks may use this information to help connect my company with qualified trade professionals. I agree to Kraftworks{' '}
                      <Link to="/terms-of-service" className="text-primary underline" target="_blank">terms & conditions</Link>{' '}and{' '}
                      <Link to="/privacy-policy" className="text-primary underline" target="_blank">privacy policy</Link>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting || !empVolume || !empState}>
                    {submitting ? 'Submitting...' : 'Join Waitlist'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </PageLayout>
  );
};

export default Waitlist;

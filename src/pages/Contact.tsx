import { useState } from 'react';
import { Mail, Send, CheckCircle } from 'lucide-react';
import { PageLayout } from '@/components/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { publicApi } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const Contact = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await publicApi.submitContact({
        full_name: fullName.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });

      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <PageLayout>
        <section className="py-12 sm:py-20 lg:py-28">
          <div className="max-w-lg mx-auto px-4 sm:px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}>
              <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-3xl font-heading font-bold text-foreground mb-3">Message Sent!</h1>
              <p className="text-muted-foreground mb-2">
                Thanks{fullName ? `, ${fullName.split(' ')[0]}` : ''}! We've received your message.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Check your email for a confirmation. We'll get back to you as soon as possible.
              </p>
              <Button variant="outline" asChild>
                <a href="/">Back to Home</a>
              </Button>
            </motion.div>
          </div>
        </section>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <section className="py-12 sm:py-20 lg:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-4">
              Contact Us
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              Have questions about your career in the trades or our platform? We're here to help.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Card className="shadow-lg border-border">
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Send us a message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and we'll get back to you as soon as possible.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="John Smith"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What is this about?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us how we can help..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      className="resize-none"
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={submitting}>
                    <Send className="mr-2 h-4 w-4" />
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>

                <p className="mt-4 text-sm text-muted-foreground text-center">
                  Or email us directly at{' '}
                  <a href="mailto:info@kraftworks.app" className="text-primary hover:underline">
                    info@kraftworks.app
                  </a>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </PageLayout>
  );
};

export default Contact;

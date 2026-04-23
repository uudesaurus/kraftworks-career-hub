import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FileText, MessageSquare, Briefcase, Users, ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CareerFairBanner } from '@/components/CareerFairBanner';
import heroImage from '@/assets/hero-welder.jpeg';
import carpenterImage from '@/assets/carpenter-roof.jpg';

const features = [
{
  title: 'Resume Review',
  description: 'Upload your resume and get straightforward, AI-powered feedback tailored for trade professionals.',
  icon: FileText,
  href: '/resume-review',
  available: true
},
{
  title: 'Interview Prep',
  description: 'Practice with real interview questions and get instant feedback to sharpen your answers.',
  icon: MessageSquare,
  href: '/interview-prep',
  available: true
},
{
  title: 'Career Toolkit',
  description: 'Templates, checklists, and guides to help you start strong on day one.',
  icon: Briefcase,
  href: '/career-toolkit',
  available: true
},
{
  title: 'Digital Career Fair',
  description: 'Connect directly with employers hiring for real trade roles. Coming soon.',
  icon: Users,
  href: '/career-fair',
  available: false
}];


const stats = [
{
  number: '649,000+',
  title: 'Trade jobs open every year',
  description: 'Construction & extraction trades average this many openings annually due to growth and retirements.'
},
{
  number: '42 Years',
  title: 'Average trade worker age',
  description: 'Only ~7% of workers are under 25, creating major opportunity for new grads.'
},
{
  number: 'AI ≠ Replacement',
  title: 'AI supports trades, not replaces them',
  description: 'Automation handles office work so techs focus on hands-on skills.',
  isStatement: true
},
{
  number: '140,000+',
  title: 'Shortage in key trades by 2030',
  description: 'Electricians, HVAC techs, welders, and equipment operators are in highest demand.'
},
{
  number: 'Over 27,000',
  title: 'Active apprenticeships in the U.S. Today',
  description: '94% of apprentices keep working after completing their program with strong earnings.'
}];


const tradeLinks = [
{ title: 'HVAC & Refrigeration', href: '/career-toolkit/hvac' },
{ title: 'Electrical Technology', href: '/career-toolkit/electrical' },
{ title: 'Welding Technology', href: '/career-toolkit/welding' }];


const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.1 * i, duration: 0.5, ease: 'easeOut' as const }
  })
};

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Trade professional welding" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-32 text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>
            
            <span className="inline-block text-xs font-medium tracking-wider uppercase text-accent-foreground mb-4 px-3 py-1.5 rounded-full bg-accent border border-border">
              Built for Trade Graduates
            </span>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-heading font-bold text-white leading-tight max-w-3xl mx-auto">
              From Class Room to Jobsite
            </h1>
            <p className="mt-5 text-base sm:text-lg text-white/80 max-w-xl mx-auto leading-relaxed">
              Practical guidance for trade grads getting hired and keeping the job.



            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link to="/auth">
                <Button size="lg" className="text-base px-8">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.h2 className="text-xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground text-center mb-8 sm:mb-12" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}>
            
            What the Numbers Say About Trade Careers
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {stats.map((stat, i) =>
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}>
              
                <Card className="h-full border-border">
                  <CardContent className="p-6">
                    <p className="text-2xl sm:text-3xl font-heading font-bold text-primary mb-2">
                      {stat.number}
                    </p>
                    <p className="font-semibold text-foreground mb-1">{stat.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{stat.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Trade Links Card */}
            <motion.div
              custom={5}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}>
              
              <Card className="h-full border-border">
                <CardContent className="p-6">
                  <p className="text-lg font-heading font-bold text-primary mb-3">More About</p>
                  <div className="space-y-2">
                    {tradeLinks.map((link) =>
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block text-foreground font-medium underline underline-offset-2 hover:text-primary transition-colors">
                      
                        {link.title}
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Motivational Quote */}
      <section className="bg-accent py-12 sm:py-16 lg:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.p
            className="text-lg sm:text-2xl lg:text-3xl xl:text-4xl font-heading font-bold text-foreground leading-snug"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Show up. Stay reliable. Keep learning.<br />
            The opportunity is real and growing.
          </motion.p>
        </div>
      </section>

      {/* Why Kraftworks Built This */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={carpenterImage} alt="Trade professional working on roof" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-foreground/70" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-20 lg:py-28 relative">
          <motion.div
            className="max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl font-heading font-bold text-white mb-6">
              Why Kraftworks Built This
            </h2>
            <p className="text-lg sm:text-xl text-white/90 leading-relaxed mb-4">
              Kraftworks works closely with trade businesses every day. We see what employers actually care about and where new hires struggle.
            </p>
            <p className="text-lg sm:text-xl text-white/90 leading-relaxed">
              This page exists to help you start strong and build a real career in the trades. We don't just support trade businesses, we support the people doing the work.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-accent py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {features.map((feature, i) =>
            <motion.div
              key={feature.title}
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}>
              
                <Link to={feature.available ? feature.href : '/career-fair'}>
                  <Card className="group h-full border-border bg-card hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-start justify-between mb-4">
                        <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center group-hover:bg-secondary/10 transition-colors">
                          <feature.icon className="h-5 w-5 text-secondary" />
                        </div>
                        {!feature.available &&
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-full">
                            Coming Soon
                          </span>
                      }
                      </div>
                      <h3 className="text-lg font-heading font-semibold text-foreground mb-1.5">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                        {feature.description}
                      </p>
                      <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        {feature.available ? 'Get started' : 'Learn more'}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Career Fair Banner */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <CareerFairBanner />
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>);
};

export default Landing;
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Zap, FileText, Download, BookOpen, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const resources = [
  {
    title: 'Electrician Resume Template',
    description: 'Designed for electrical technology graduates entering the workforce.',
    type: 'Template',
    link: 'https://drive.google.com/drive/u/1/folders/18kwxi-apdcdYwupiYy3vO12x5fwt6GKM',
  },
  {
    title: 'Electrician Tool Kit Checklist',
    description: 'Must-have hand tools, meters, and safety gear for your first job.',
    type: 'Checklist',
    link: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
  },
  {
    title: 'Follow Up Email/Text Message Template',
    description: 'Professional follow-up message to send after your interview.',
    type: 'Template',
    link: 'https://docs.google.com/document/d/1WlqFN9zOEmNWbKQNx_latAOGAYbgMG7C4WransVcob0/edit?tab=t.0#heading=h.jreaebip9h1p',
  },
];

const article = {
  title: 'NEC Code Quick Reference',
  description: 'Key National Electrical Code sections every new electrician should know.',
  category: 'Electrical',
  thumbnail: '/assets/articles/nec-code-quick-reference.png',
  link: '/career-toolkit/articles/nec-code-quick-reference',
};

const topics = [
  'Residential wiring basics and common circuit layouts',
  'How to read electrical blueprints and one-line diagrams',
  'Understanding NEC code compliance on the jobsite',
  'Lockout/tagout procedures and arc flash safety',
  'Tips for working efficiently with journeymen and foremen',
];

const stats = [
  {
    title: '$283B+ Market',
    description: 'Electrical contracting continues to grow through 2028.',
  },
  {
    title: '$40K–$50K Entry-Level Pay',
    description: 'Apprentices and new hires see steady wage growth.',
  },
  {
    title: 'High-Demand Skills',
    description: 'EV charging, smart systems, energy efficiency, and safety.',
  },
  {
    title: '8% Employment Growth',
    description: 'Electrician employment is projected to grow by about 8%, faster than many other occupations.',
  },
  {
    title: '81,000 Openings/Year',
    description: 'Consistent demand for new electricians.',
  },
  {
    title: 'Long-Term Opportunity',
    description: 'Electrification, clean energy, and infrastructure upgrades continue to create steady demand for skilled electricians.',
  },
];

const careerPathways = [
  {
    stage: 'Early Career',
    roles: ['Electrical Helper', 'Apprentice Electrician'],
    focus: ['Assisting licensed electricians', 'Running conduit and pulling wire', 'Installing outlets, fixtures, and panels', 'Learning jobsite safety and electrical codes'],
    credentials: ['OSHA-10', 'Apprentice registration (requirements vary by state)'],
    credentialsLabel: 'Common credentials:',
  },
  {
    stage: 'Developing Licensed Role',
    roles: ['Journeyman Electrician'],
    focus: ['Working independently', 'Reading blueprints and electrical schematics', 'Commercial or industrial electrical projects', 'Troubleshooting and repairs'],
    credentials: ['Journeyman Electrician License (licensing requirements vary by state)'],
    credentialsLabel: 'Credential:',
  },
  {
    stage: 'Advanced & Leadership Roles',
    roles: ['Master Electrician', 'Electrical Foreman'],
    focus: ['Leading crews and overseeing installations', 'Ensuring code compliance and safety', 'Planning layouts and coordinating work', 'Mentoring apprentices and journeymen'],
    credentials: ['Estimating or system design', 'Inspection or compliance roles'],
    credentialsLabel: 'Optional paths:',
  },
  {
    stage: 'Growth Opportunities',
    roles: ['Electrical Contractor', 'Electrical Inspector', 'Project Management or supervision', 'Business ownership'],
    focus: [],
    credentials: [],
    credentialsLabel: '',
  },
];

const CareerToolkitElectrical = () => {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Zap className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Electrical Technology</h1>
            <p className="text-muted-foreground mt-1">
              Resources, templates, and guides for new electricians entering the field.
            </p>
          </div>
        </div>

        {/* Facts & Numbers */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            Facts & Numbers
          </h2>
          <Card className="border-border bg-accent">
            <CardContent className="p-6 sm:p-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {stats.map((stat, i) => (
                  <div key={i}>
                    <h3 className="text-lg font-heading font-bold text-primary mb-2">{stat.title}</h3>
                    <p className="text-sm text-foreground leading-relaxed">{stat.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Common Electrician Career Pathways */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            Common Electrician Career Pathways (examples)
          </h2>

          {/* Stage Cards Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {careerPathways.map((path, i) => (
              <Card key={i} className="bg-secondary border-0 h-full">
                <CardContent className="p-5 h-full flex flex-col">
                  <h3 className="text-lg font-heading font-bold text-white mb-3">{path.stage}</h3>
                  <ul className="space-y-1.5">
                    {path.roles.map((role, j) => (
                      <li key={j} className="text-sm text-white/90 flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-white/70 shrink-0" />
                        {role}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detail Cards Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {careerPathways.map((path, i) => (
              <div key={i}>
                {(path.focus.length > 0 || path.credentials.length > 0) ? (
                  <Card className="border-secondary/30 border-dashed border-2 h-full">
                    <CardContent className="p-5">
                      {path.focus.length > 0 && (
                        <>
                          <p className="font-heading font-bold text-foreground mb-2">Typical focus:</p>
                          <ul className="space-y-1.5 mb-4">
                            {path.focus.map((item, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                      {path.credentials.length > 0 && (
                        <>
                          <p className="font-heading font-bold text-foreground mb-2">{path.credentialsLabel}</p>
                          <ul className="space-y-1.5">
                            {path.credentials.map((cred, j) => (
                              <li key={j} className="text-sm text-muted-foreground flex items-start gap-2">
                                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                {cred}
                              </li>
                            ))}
                          </ul>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ) : <div />}
              </div>
            ))}
          </div>

          <p className="text-sm text-muted-foreground italic mt-6">
            *Career paths and timelines vary by employer, region, and experience. Business ownership may require additional licensing, insurance, and experience depending on the trade.
          </p>
        </section>

        {/* Templates & Downloads */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Templates & Downloads</CardTitle>
            <CardDescription>Electrical trade career documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((res, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="h-9 w-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-secondary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{res.title}</p>
                  <p className="text-xs text-muted-foreground">{res.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] shrink-0">{res.type}</Badge>
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={res.link} target="_blank" rel="noopener noreferrer">
                      <Download className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Article */}
        <Link to={article.link} className="block max-w-md">
          <Card className="group hover:border-secondary/40 transition-all duration-300 hover:shadow-lg overflow-hidden cursor-pointer">
            <div className="aspect-[2/1] w-full overflow-hidden">
              <img
                src={article.thumbnail}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </div>
            <CardContent className="p-4 pt-3">
              <Badge variant="outline" className="text-[10px] mb-2">{article.category}</Badge>
              <h3 className="text-lg font-heading font-bold text-foreground mb-1 group-hover:text-primary transition-colors">{article.title}</h3>
              <p className="text-sm text-muted-foreground">{article.description}</p>
            </CardContent>
          </Card>
        </Link>

        {/* Key Topics */}
        <Card>
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-secondary" />
              Key Topics for New Electricians
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topics.map((topic, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                <span className="text-sm font-medium text-primary">{i + 1}.</span>
                <p className="text-sm">{topic}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default CareerToolkitElectrical;

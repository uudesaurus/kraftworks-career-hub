import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Thermometer, FileText, Download, BookOpen, Star, HardHat, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const resources = [
  {
    title: 'HVAC Technician Resume Template',
    description: 'Tailored for entry-level HVAC & refrigeration graduates with certification highlights.',
    type: 'Template',
    link: 'https://drive.google.com/drive/u/1/folders/18kwxi-apdcdYwupiYy3vO12x5fwt6GKM',
  },
  {
    title: 'HVAC Tool & Safety Checklist',
    description: 'Essential tools and PPE you need on day one as an HVAC tech.',
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
  title: 'EPA 608 Certification Prep Guide',
  description: 'Study guide covering Section 608 refrigerant handling requirements.',
  category: 'HVAC',
  thumbnail: '/assets/articles/epa-608-certification-prep-guide.png',
  link: '/career-toolkit/articles/epa-608-certification-prep-guide',
};

const topics = [
  'Understanding residential vs. commercial HVAC systems',
  'How to read and interpret HVAC blueprints and schematics',
  'Common refrigerant types and safe handling practices',
  'Troubleshooting airflow and temperature issues',
  'Building strong client communication skills as a new tech',
];

const stats = [
  {
    title: 'Projected $54B+ Market',
    description: 'The U.S. HVAC industry is projected to be valued at over $54 billion in 2033, with steady growth driven by system replacements and upgrades.',
  },
  {
    title: '6% Job Growth',
    description: 'Employment for HVAC technicians and installers is projected to grow by about 6% through 2032, faster than average.',
  },
  {
    title: 'High-Demand Skills',
    description: 'HVAC techs with experience in smart systems, indoor air quality, and energy-efficient equipment are in growing demand.',
  },
  {
    title: '3 Million Systems/Year',
    description: 'U.S. homeowners replace or install about 3 million heating and cooling systems each year, driving steady demand.',
  },
  {
    title: '$45K–$54K Entry-Level Pay',
    description: 'Most entry-level HVAC technicians earn $45,000–$54,000 per year, with experienced techs earning more through overtime and bonuses.',
  },
  {
    title: 'Long-Term Opportunity',
    description: 'Aging systems, climate needs, and energy upgrades continue to create reliable, long-term work for HVAC professionals.',
  },
];

const careerPathways = [
  {
    stage: 'Early Career',
    roles: ['HVAC Technician', 'HVAC Service Technician', 'HVAC Mechanic', 'Residential or Maintenance Technician'],
    focus: ['Installing and servicing HVAC systems', 'Basic troubleshooting and diagnostics', 'Preventive maintenance', 'Learning safety practices, tools, and jobsite workflows'],
    credentials: ['EPA 608 Certification', 'OSHA-10'],
    credentialsLabel: 'Certifications:',
  },
  {
    stage: 'Developing Roles',
    roles: ['HVAC Service Technician', 'Commercial HVAC Technician'],
    focus: ['Diagnosing system performance issues', 'Working on larger or commercial systems', 'Customer communication and documentation', 'Increased independence on service calls'],
    credentials: ['NATE Certification', 'State HVAC License (requirements vary by state)'],
    credentialsLabel: 'Common credentials:',
  },
  {
    stage: 'Advanced & Specialized Roles',
    roles: ['Senior HVAC Technician', 'Controls Technician'],
    focus: ['Advanced diagnostics and system optimization', 'Controls and automation systems', 'Supporting or mentoring junior technicians'],
    credentials: ['Estimating', 'Training', 'Technical sales (role-dependent)'],
    credentialsLabel: 'Optional transitions:',
  },
  {
    stage: 'Growth Opportunities',
    roles: ['Controls or specialty systems', 'Lead technician roles', 'Project coordination / supervision', 'Self-employment'],
    focus: [],
    credentials: [],
    credentialsLabel: '',
  },
];

const CareerToolkitHVAC = () => {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Thermometer className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">HVAC & Refrigeration</h1>
            <p className="text-muted-foreground mt-1">
              Resources, templates, and guides for new HVAC and refrigeration technicians.
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

        {/* Common HVAC Career Pathways */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            Common HVAC Career Pathways (examples)
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
            <CardDescription>HVAC-specific career documents</CardDescription>
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
              Key Topics for New HVAC Techs
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

export default CareerToolkitHVAC;

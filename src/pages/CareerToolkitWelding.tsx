import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, FileText, Download, BookOpen, Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const resources = [
  {
    title: 'Welder Resume Template',
    description: 'Built for welding technology graduates highlighting certifications and shop skills.',
    type: 'Template',
    link: 'https://drive.google.com/drive/u/1/folders/18kwxi-apdcdYwupiYy3vO12x5fwt6GKM',
  },
  {
    title: 'Welding Shop Safety Checklist',
    description: 'PPE, ventilation, and fire safety essentials for your first day in the shop.',
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
  title: 'AWS Certification Overview',
  description: 'Summary of American Welding Society certifications and how to prepare.',
  category: 'Welding',
  thumbnail: '/assets/articles/aws-certification-overview.png',
  link: '/career-toolkit/articles/aws-certification-overview',
};

const topics = [
  'MIG vs TIG vs Stick: choosing the right process for the job',
  'Reading welding symbols and blueprint specifications',
  'Understanding weld inspection and quality standards',
  'Common welding defects and how to prevent them',
  'Career paths: from shop floor to certified welding inspector',
];

const stats = [
  {
    title: '49K+ Welders in Texas',
    description: 'Texas is one of the largest welding hubs in the U.S., with nearly 50,000 welders, especially concentrated in Houston, Dallas, and San Antonio.',
  },
  {
    title: 'High-Demand Industries',
    description: 'Welders are essential across manufacturing, construction, energy, and aerospace, creating diverse job opportunities nationwide.',
  },
  {
    title: 'Advanced Welding Technology',
    description: 'New methods like laser welding and metal 3D printing are expanding the types of work welders can do and increasing demand for skilled operators.',
  },
  {
    title: '320K+ New Welders Needed',
    description: 'The U.S. will need over 320,000 new welding professionals by 2029, driven by retirements and continued industrial demand.',
  },
  {
    title: '$39K–$51K Entry-Level Pay',
    description: 'Most entry-level welders earn between $39,000 and $51,000 per year, with higher pay available for specialized skills and certifications.',
  },
  {
    title: 'Long-Term Opportunity',
    description: 'Infrastructure projects, energy production, and equipment maintenance continue to create stable, long-term career paths for welders.',
  },
];

const careerPathways = [
  {
    stage: 'Early Career',
    roles: ['Welder', 'Fabrication Welder', 'Shop Welder'],
    focus: ['MIG / TIG / Stick welding', 'Blueprint and basic fabrication reading', 'Shop or field-based welding work', 'Learning safety procedures, tools, and materials'],
    credentials: ['AWS Welding Certifications (process- or position-specific)'],
    credentialsLabel: 'Common Certifications:',
  },
  {
    stage: 'Developing Roles',
    roles: ['Pipe Welder', 'Structural Welder'],
    focus: ['Specialized welding processes and positions', 'Higher precision and stricter safety standards', 'Working on structural, pipe, or code-based projects', 'Increased responsibility for quality and accuracy'],
    credentials: [],
    credentialsLabel: '',
  },
  {
    stage: 'Advanced & Leadership Roles',
    roles: ['Senior Welder', 'Welding Inspector (CWI)', 'Welding Supervisor'],
    focus: ['Oversight of weld quality and compliance', 'Inspection, testing, and documentation', 'Mentoring or leading welding teams'],
    credentials: ['Transition into inspection or quality roles', 'Supervisory or lead welder responsibilities'],
    credentialsLabel: 'Optional paths:',
  },
  {
    stage: 'Growth Opportunities',
    roles: ['Specialized welding fields (pipe, structural, specialty alloys)', 'Inspection and quality control', 'Automation, robotics, or advanced manufacturing', 'Own fabrication shop / self-employment'],
    focus: [],
    credentials: [],
    credentialsLabel: '',
  },
];

const CareerToolkitWelding = () => {
  return (
    <PageLayout>
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16 space-y-12">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <Flame className="h-6 w-6 text-secondary" />
          </div>
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Welding Technology</h1>
            <p className="text-muted-foreground mt-1">
              Resources, templates, and guides for new welders entering the workforce.
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

        {/* Common Welding Career Pathways */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-8">
            Common Welding Career Pathways (examples)
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
            <CardDescription>Welding trade career documents</CardDescription>
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
              Key Topics for New Welders
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

export default CareerToolkitWelding;

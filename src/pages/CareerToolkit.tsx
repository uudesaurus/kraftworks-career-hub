import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, Briefcase, Zap, Flame, Thermometer, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CareerFairBanner } from '@/components/CareerFairBanner';
import { articles } from '@/data/articles';

const resources = [
  {
    title: 'Trade Resume Template',
    description: 'Entry-level friendly resume template designed for trade professionals.',
    type: 'Template',
    icon: FileText,
    link: 'https://drive.google.com/drive/u/1/folders/18kwxi-apdcdYwupiYy3vO12x5fwt6GKM',
  },
  {
    title: 'Reference List Template',
    description: 'Professional reference sheet — most grads don\'t have this ready.',
    type: 'Template',
    icon: FileText,
    link: 'https://docs.google.com/document/d/1jHTyzZ1_x_ERDnoK9hJo3Jo1W_RULnt5/edit#heading=h.rj9dp6uxjezl',
  },
  {
    title: 'Tools Readiness Checklist',
    description: 'What to bring (and what not to) on your first day.',
    type: 'Checklist',
    icon: Briefcase,
    link: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
  },
  {
    title: 'Follow Up Email/Text Message Template',
    description: 'Professional follow-up message to send after your interview.',
    type: 'Template',
    icon: FileText,
    link: 'https://docs.google.com/document/d/1WlqFN9zOEmNWbKQNx_latAOGAYbgMG7C4WransVcob0/edit?tab=t.0#heading=h.jreaebip9h1p',
  },
];


const trades = [
  {
    title: 'HVAC & Refrigeration',
    description: 'Resources for HVAC techs — EPA prep, tool lists, and resume templates.',
    icon: Thermometer,
    href: '/career-toolkit/hvac',
  },
  {
    title: 'Electrical Technology',
    description: 'NEC code references, electrician resumes, and safety checklists.',
    icon: Zap,
    href: '/career-toolkit/electrical',
  },
  {
    title: 'Welding Technology',
    description: 'AWS certification guides, welding resumes, and shop safety essentials.',
    icon: Flame,
    href: '/career-toolkit/welding',
  },
];

const CareerToolkit = () => {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-bold text-foreground">Career Toolkit</h1>
          <p className="text-muted-foreground mt-1">
            Everything you need to start strong, earn trust, and move up in your trade.
          </p>
        </div>

        {/* Trade-Specific Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {trades.map((trade) => (
            <Link key={trade.href} to={trade.href}>
              <Card className="group h-full hover:border-secondary/40 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-5">
                  <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center mb-3 group-hover:bg-secondary/10 transition-colors">
                    <trade.icon className="h-5 w-5 text-secondary" />
                  </div>
                  <h3 className="font-heading font-semibold text-foreground mb-1">{trade.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{trade.description}</p>
                  <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Explore <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading">Templates & Downloads</CardTitle>
            <CardDescription>Essential documents to kickstart your career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {resources.map((res, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <res.icon className="h-4 w-4 text-primary" />
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

        <div>
          <h2 className="text-xl font-heading font-semibold text-foreground mb-1">Jobsite & Career Advice</h2>
          <p className="text-sm text-muted-foreground mb-4">Articles and guides for new trade professionals</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {articles.map((article) => (
              <Link key={article.slug} to={`/career-toolkit/articles/${article.slug}`}>
                <Card className="group h-full hover:border-secondary/40 transition-all duration-300 hover:shadow-lg overflow-hidden">
                  {article.thumbnail && (
                    <div className="w-full aspect-video overflow-hidden">
                      <img
                        src={article.thumbnail}
                        alt={article.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <CardContent className="p-5">
                    <Badge variant="outline" className="text-[10px] mb-2">{article.category}</Badge>
                    <h3 className="font-heading font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{article.description}</p>
                    <div className="mt-3 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      Read article <ArrowRight className="ml-1 h-3.5 w-3.5" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <CareerFairBanner />
      </div>
    </PageLayout>
  );
};

export default CareerToolkit;

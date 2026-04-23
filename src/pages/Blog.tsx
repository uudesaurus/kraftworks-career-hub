import { Link } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen } from 'lucide-react';

const posts = [
  {
    title: 'How Newly Graduated Trade Professionals Can Build a Strong Resume',
    excerpt: 'Your resume is your first impression — learn what employers in the trades actually look for.',
    category: 'Career Tips',
    date: 'Mar 15, 2026',
    link: '/career-toolkit/articles/build-strong-resume',
    isExternal: false,
  },
  {
    title: 'What Employers Actually Notice in the First 30 Days',
    excerpt: 'The habits and attitudes that set new hires apart from day one on the jobsite.',
    category: 'Jobsite',
    date: 'Mar 10, 2026',
    link: '/career-toolkit/articles/what-employers-notice',
    isExternal: false,
  },
  {
    title: 'How to Avoid Common New-Hire Mistakes',
    excerpt: 'From showing up late to skipping PPE — small mistakes that cost new trade workers big.',
    category: 'Advice',
    date: 'Mar 5, 2026',
    link: '/career-toolkit/articles/avoid-new-hire-mistakes',
    isExternal: false,
  },
  {
    title: 'The Smart Ways Trade Grads Keep Learning on the Job',
    excerpt: 'Your education doesn\'t stop at graduation. Here\'s how the best techs keep growing.',
    category: 'Growth',
    date: 'Feb 28, 2026',
    link: '/career-toolkit/articles/keep-learning-on-the-job',
    isExternal: false,
  },
  {
    title: 'AWS Certification Overview: Proving Your Skills to the World',
    excerpt: 'Break down of AWS certifications, what to expect from each exam, and how to actually prepare.',
    category: 'Welding',
    date: 'Feb 20, 2026',
    link: '/career-toolkit/articles/aws-certification-overview',
    isExternal: false,
  },
  {
    title: 'NEC Code Quick Reference: Your Guide to the Electrical Rulebook',
    excerpt: 'Key National Electrical Code sections every new electrician should know for the job and exams.',
    category: 'Electrical',
    date: 'Feb 15, 2026',
    link: '/career-toolkit/articles/nec-code-quick-reference',
    isExternal: false,
  },
];

const Blog = () => {
  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-6 w-6 text-secondary" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-foreground">Blog</h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Career advice, trade tips, and industry insights for new professionals.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          {posts.map((post, i) => {
            const cardContent = (
              <Card key={i} className="group hover:border-secondary/40 transition-all duration-300 hover:shadow-lg cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="outline" className="text-[10px]">{post.category}</Badge>
                    <span className="text-xs text-muted-foreground">{post.date}</span>
                  </div>
                  <h2 className="text-lg font-heading font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">{post.excerpt}</p>
                </CardContent>
              </Card>
            );

            return post.isExternal ? (
              <a key={i} href={post.link} target="_blank" rel="noopener noreferrer">
                {cardContent}
              </a>
            ) : (
              <Link key={i} to={post.link}>
                {cardContent}
              </Link>
            );
          })}
        </div>
      </div>
    </PageLayout>
  );
};

export default Blog;

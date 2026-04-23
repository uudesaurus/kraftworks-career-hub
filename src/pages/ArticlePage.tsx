import { useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/PageLayout';
import { getArticleBySlug } from '@/data/articles';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const ArticlePage = () => {
  const { slug } = useParams<{slug: string;}>();
  const article = slug ? getArticleBySlug(slug) : undefined;

  if (!article) {
    return (
      <PageLayout>
        <div className="max-w-3xl mx-auto px-6 py-16 text-center">
          <h1 className="text-2xl font-heading font-bold text-foreground mb-4">Article Not Found</h1>
          <p className="text-muted-foreground mb-6">The article you're looking for doesn't exist.</p>
          <Link to="/career-toolkit">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Toolkit
            </Button>
          </Link>
        </div>
      </PageLayout>);

  }

  return (
    <PageLayout>
      <article className="max-w-3xl mx-auto px-6 py-12 sm:py-16">
        <Link to="/career-toolkit">
          <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
            Back to Toolkit
          </Button>
        </Link>

        {article.thumbnail &&
        <div className="w-full aspect-video rounded-xl overflow-hidden mb-8">
            <img
            src={article.thumbnail}
            alt={article.title}
            loading="lazy"
            className="w-full h-full object-cover" />
          
          </div>
        }

        <Badge variant="outline" className="mb-3">{article.category}</Badge>
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-4">
          {article.title}
        </h1>
        <p className="text-lg text-muted-foreground mb-8">{article.description}</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {article.content ?
          <div dangerouslySetInnerHTML={{ __html: article.content }} className="font-normal" /> :

          <div className="rounded-lg border border-dashed border-border bg-muted/50 p-8 text-center">
              <p className="text-sm text-muted-foreground">Article content coming soon.</p>
            </div>
          }
        </div>
      </article>
    </PageLayout>);

};

export default ArticlePage;
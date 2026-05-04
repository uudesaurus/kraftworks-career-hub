import { FileText, ClipboardCheck, BookOpen, Newspaper } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface Resource {
  id: string;
  name: string;
  type: 'template' | 'checklist' | 'guide' | 'article';
  trade: 'general' | 'electrical' | 'hvac' | 'welding';
  description: string;
  url: string;
  isExternal: boolean;
}

export const RESOURCE_CATALOG: Resource[] = [
  // General toolkit resources
  {
    id: 'resume-template',
    name: 'Trade Resume Template',
    type: 'template',
    trade: 'general',
    description: 'Entry-level friendly resume template designed for trade professionals.',
    url: 'https://drive.google.com/drive/u/1/folders/18kwxi-apdcdYwupiYy3vO12x5fwt6GKM',
    isExternal: true,
  },
  {
    id: 'reference-list',
    name: 'Reference List Template',
    type: 'template',
    trade: 'general',
    description: 'Professional reference sheet — most grads don\'t have this ready.',
    url: 'https://docs.google.com/document/d/1jHTyzZ1_x_ERDnoK9hJo3Jo1W_RULnt5/edit#heading=h.rj9dp6uxjezl',
    isExternal: true,
  },
  {
    id: 'tools-checklist',
    name: 'Tools Readiness Checklist',
    type: 'checklist',
    trade: 'general',
    description: 'What to bring (and what not to) on your first day.',
    url: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
    isExternal: true,
  },
  {
    id: 'followup-template',
    name: 'Follow Up Email/Text Template',
    type: 'template',
    trade: 'general',
    description: 'Professional follow-up message to send after your interview.',
    url: 'https://docs.google.com/document/d/1WlqFN9zOEmNWbKQNx_latAOGAYbgMG7C4WransVcob0/edit?tab=t.0#heading=h.jreaebip9h1p',
    isExternal: true,
  },
  // Electrical
  {
    id: 'nec-code-ref',
    name: 'NEC Code Quick Reference',
    type: 'article',
    trade: 'electrical',
    description: 'Key National Electrical Code sections every new electrician should know.',
    url: '/career-toolkit/articles/nec-code-quick-reference',
    isExternal: false,
  },
  {
    id: 'electrical-toolkit',
    name: 'Electrician Tool Kit Checklist',
    type: 'checklist',
    trade: 'electrical',
    description: 'Must-have hand tools, meters, and safety gear for your first job.',
    url: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
    isExternal: true,
  },
  // HVAC
  {
    id: 'epa-608-prep',
    name: 'EPA 608 Certification Prep Guide',
    type: 'article',
    trade: 'hvac',
    description: 'Study guide covering Section 608 refrigerant handling requirements.',
    url: '/career-toolkit/articles/epa-608-certification-prep-guide',
    isExternal: false,
  },
  {
    id: 'hvac-toolkit',
    name: 'HVAC Tool & Safety Checklist',
    type: 'checklist',
    trade: 'hvac',
    description: 'Essential tools and PPE you need on day one as an HVAC tech.',
    url: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
    isExternal: true,
  },
  // Welding
  {
    id: 'aws-cert-overview',
    name: 'AWS Certification Overview',
    type: 'article',
    trade: 'welding',
    description: 'Summary of American Welding Society certifications and how to prepare.',
    url: '/career-toolkit/articles/aws-certification-overview',
    isExternal: false,
  },
  {
    id: 'welding-safety',
    name: 'Welding Shop Safety Checklist',
    type: 'checklist',
    trade: 'welding',
    description: 'PPE, ventilation, and fire safety essentials for your first day in the shop.',
    url: 'https://drive.google.com/drive/u/1/folders/1-I7Ik-YsCwBo89cCW7NqV90_jzTnOiiY',
    isExternal: true,
  },
  // Trade-specific articles (external)



  // Articles (internal links)
  {
    id: 'article-interview-tips',
    name: 'Skilled Trades Interview Tips',
    type: 'article',
    trade: 'general',
    description: 'Interview mindset, what managers listen for, and how to stand out.',
    url: '/career-toolkit/articles/skilled-trades-interview-tips',
    isExternal: false,
  },
  {
    id: 'article-resume-guide',
    name: 'Build a Strong Resume',
    type: 'article',
    trade: 'general',
    description: 'Resume structure guide with practical examples for trades.',
    url: '/career-toolkit/articles/build-strong-resume',
    isExternal: false,
  },
  {
    id: 'article-employers-notice',
    name: 'What Employers Notice',
    type: 'article',
    trade: 'general',
    description: 'What hiring managers look for in the first 30 days on the job.',
    url: '/career-toolkit/articles/what-employers-notice',
    isExternal: false,
  },
  {
    id: 'article-new-hire-mistakes',
    name: 'Avoid New Hire Mistakes',
    type: 'article',
    trade: 'general',
    description: '6 common pitfalls for new hires in skilled trades.',
    url: '/career-toolkit/articles/avoid-new-hire-mistakes',
    isExternal: false,
  },
  {
    id: 'article-raises-promotions',
    name: 'Raises and Promotions',
    type: 'article',
    trade: 'general',
    description: 'How pay and career advancement works in the trades.',
    url: '/career-toolkit/articles/raises-and-promotions',
    isExternal: false,
  },
  {
    id: 'article-keep-learning',
    name: 'Keep Learning on the Job',
    type: 'article',
    trade: 'general',
    description: 'How to keep developing your skills while working full-time.',
    url: '/career-toolkit/articles/keep-learning-on-the-job',
    isExternal: false,
  },
];

const resourceCatalogMap = new Map(RESOURCE_CATALOG.map(r => [r.id, r]));

export function getResourceById(id: string): Resource | undefined {
  return resourceCatalogMap.get(id);
}

export const RESOURCE_TYPE_ICONS: Record<Resource['type'], LucideIcon> = {
  template: FileText,
  checklist: ClipboardCheck,
  guide: BookOpen,
  article: Newspaper,
};

export const RESOURCE_TYPE_LABELS: Record<Resource['type'], string> = {
  template: 'Template',
  checklist: 'Checklist',
  guide: 'Guide',
  article: 'Article',
};

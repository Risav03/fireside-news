import type { ArticleCategory } from "@repo/db";

export type NewsCategory = ArticleCategory;

export type IngestedArticle = {
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: Date;
  category: NewsCategory;
};

export type ProcessedContent = {
  headline: string;
  summary: string;
  priority: number;
};

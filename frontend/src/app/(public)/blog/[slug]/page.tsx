import type { Metadata } from "next";
import { getArticle, getAllSlugs } from "@/lib/blog-data";
import BlogArticleClient from "./blog-article-client";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) {
    return { title: "Cikk nem található" };
  }
  return {
    title: article.title,
    description: article.title,
    openGraph: {
      title: article.title,
      description: article.title,
      type: "article",
      publishedTime: article.date,
      images: [{ url: article.image, width: 1200, height: 630, alt: article.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.title,
      images: [article.image],
    },
  };
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export default function BlogArticlePage() {
  return <BlogArticleClient />;
}

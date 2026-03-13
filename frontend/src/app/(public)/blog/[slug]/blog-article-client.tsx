"use client";

import Link from "next/link";
import { sanitizeHtml } from "@/lib/sanitize";

interface BlogArticleProps {
  article: {
    title: string;
    category: string;
    date: string;
    readTime: string;
    image: string;
    content: string;
  };
}

export default function BlogArticleClient({ article }: BlogArticleProps) {
  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cikk nem található</h1>
        <p className="text-gray-500 mb-8">A keresett cikk nem létezik vagy eltávolításra került.</p>
        <Link href="/blog" className="text-brand-teal-dark font-semibold hover:underline">
          Vissza a bloghoz
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-brand-teal-dark font-medium hover:underline mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Vissza a bloghoz
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal-dark">
            {article.category}
          </span>
          <span className="text-xs text-gray-400">{article.readTime} olvasás</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>
        <p className="text-sm text-gray-400">{article.date}</p>
      </div>

      <img src={article.image} alt={article.title} className="w-full rounded-2xl mb-8" />

      <div
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
      />

      <div className="mt-16 pt-8 border-t">
        <div className="bg-gradient-to-br from-brand-teal-dark to-brand-teal rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Készen állsz a digitális szerződéskezelésre?</h3>
          <p className="text-white/70 text-sm mb-6">Regisztrálj ingyen, és készítsd el az első szerződésed percek alatt.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg"
          >
            Ingyenes regisztráció
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

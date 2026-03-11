"use client";

import Link from "next/link";
import { posts } from "@/lib/blog-data";

export default function BlogPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="text-brand-teal font-semibold text-sm uppercase tracking-wider mb-3">Blog</p>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">
          Szerződések, jog, digitalizáció
        </h1>
        <p className="text-gray-500 text-lg">
          Praktikus cikkek magyar vállalkozásoknak a szerződéskezelésről, jogi háttérről és a digitális átállásról.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:border-brand-teal/20 transition-all group flex flex-col"
          >
            <div className="h-48 bg-gray-100 rounded-t-2xl overflow-hidden -mx-6 -mt-6 mb-4">
              <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${post.color}`}>
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.readTime}</span>
            </div>
            <h2 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-brand-teal-dark transition leading-snug">
              {post.title}
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed mb-4 flex-1">
              {post.excerpt}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400 pt-4 border-t">
              <span>{post.date}</span>
              <span className="text-brand-teal-dark font-semibold group-hover:underline flex items-center gap-1">
                Olvasás
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

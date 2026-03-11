"use client";

import Link from "next/link";

const posts = [
  {
    slug: "mesterseges-intelligencia-szerzodesek-jovo",
    title: "Mesterséges intelligencia a szerződéskezelésben: így alakítja át az AI a jogi munkát",
    excerpt: "Automatizált elemzés, kockázatfelismerés, záradékjavaslatok — az AI forradalmasítja a szerződések kezelését. Mutatjuk, hogyan.",
    category: "Technológia",
    date: "2026. március 11.",
    readTime: "10 perc",
    image: "/images/blog/mesterseges-intelligencia-szerzodesek-jovo.jpg",
    color: "bg-indigo-100 text-indigo-700",
  },
  {
    slug: "vallalkozas-inditasa-szukseges-szerzodesek",
    title: "Vállalkozást indítasz? Ezek a szerződések kellenek az első naptól",
    excerpt: "Alapító okirat, társasági szerződés, NDA, munkavállalói megállapodások — összegyűjtöttük a teljes indulási checklist-et.",
    category: "Útmutató",
    date: "2026. március 10.",
    readTime: "9 perc",
    image: "/images/blog/vallalkozas-inditasa-szukseges-szerzodesek.jpg",
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    slug: "freelancer-szerzodes-szabalyok-2026",
    title: "Freelancer vagy megbízott? Így köss szabályos szerződést 2026-ban",
    excerpt: "Megbízási vagy vállalkozási? Adójogi buktatók, kötelező elemek és gyakori hibák a szabadúszó szerződéseknél.",
    category: "Munkajog",
    date: "2026. március 9.",
    readTime: "9 perc",
    image: "/images/blog/freelancer-szerzodes-szabalyok-2026.jpg",
    color: "bg-blue-100 text-blue-700",
  },
  {
    slug: "berles-szerzodes-buktatoi-amikre-figyelj",
    title: "Bérleti szerződés buktatói: 7 pont, amit soha ne hagyj ki",
    excerpt: "Kaució, felmondás, közüzem, albérlet — a leggyakoribb hibák és csapdák a lakásbérleti szerződéseknél.",
    category: "Ingatlan",
    date: "2026. március 8.",
    readTime: "8 perc",
    image: "/images/blog/berles-szerzodes-buktatoi-amikre-figyelj.jpg",
    color: "bg-amber-100 text-amber-700",
  },
  {
    slug: "szerzodes-felmondasanak-szabalyai",
    title: "Szerződés felmondása: mikor, hogyan és milyen következményekkel?",
    excerpt: "Rendes és rendkívüli felmondás, felmondási idő, formai követelmények — minden, amit a szerződés megszüntetéséről tudnod kell.",
    category: "Jogi útmutató",
    date: "2026. március 7.",
    readTime: "9 perc",
    image: "/images/blog/szerzodes-felmondasanak-szabalyai.jpg",
    color: "bg-brand-teal/10 text-brand-teal-dark",
  },
  {
    slug: "elektronikus-alairas-magyarorszagon-2026",
    title: "Elektronikus aláírás Magyarországon 2026-ban: amit tudnod kell",
    excerpt: "Mi az e-aláírás, hogyan működik jogilag, és mikor érvényes? Átfogó útmutató az eIDAS rendeletről és a magyar szabályozásról.",
    category: "Jogi útmutató",
    date: "2026. március 5.",
    readTime: "8 perc",
    image: "/images/blog/elektronikus-alairas-magyarorszagon-2026.jpg",
    color: "bg-brand-teal/10 text-brand-teal-dark",
  },
  {
    slug: "szerzodeskezeles-kkv-digitalizacio",
    title: "5 ok, amiért a KKV-knak digitalizálniuk kell a szerződéskezelést",
    excerpt: "A papíralapú szerződések lassúak, költségesek és kockázatosak. Mutatjuk, hogyan spórolhatsz időt és pénzt a digitális átállással.",
    category: "Digitalizáció",
    date: "2026. február 28.",
    readTime: "5 perc",
    image: "/images/blog/szerzodeskezeles-kkv-digitalizacio.jpg",
    color: "bg-brand-gold/10 text-brand-gold-dark",
  },
  {
    slug: "ptk-szerzodeskotes-alapjai",
    title: "Szerződéskötés alapjai: amit a Ptk. mond a vállalkozásoknak",
    excerpt: "A Polgári Törvénykönyv legfontosabb szabályai a szerződésekről: alaki követelmények, érvényesség, szerződésszegés.",
    category: "Jogi útmutató",
    date: "2026. február 20.",
    readTime: "10 perc",
    image: "/images/blog/ptk-szerzodeskotes-alapjai.jpg",
    color: "bg-brand-teal/10 text-brand-teal-dark",
  },
  {
    slug: "nda-titoktartasi-szerzodes-minta",
    title: "NDA / titoktartási szerződés: mikor kell és hogyan készítsd el",
    excerpt: "Az NDA a leggyakrabban használt üzleti szerződések egyike. Bemutatjuk, mikor szükséges, mit tartalmazzon, és hogyan készíthetsz egyet percek alatt.",
    category: "Sablonok",
    date: "2026. február 15.",
    readTime: "6 perc",
    image: "/images/blog/nda-titoktartasi-szerzodes-minta.jpg",
    color: "bg-purple-100 text-purple-700",
  },
  {
    slug: "gdpr-szerzodes-adatvedelem",
    title: "GDPR és szerződések: adatvédelmi kötelezettségek a vállalkozásodban",
    excerpt: "Milyen adatvédelmi záradékokat kell tartalmaznia a szerződéseidnek? Mikor kell adatfeldolgozói megállapodás? Gyakorlati útmutató.",
    category: "Adatvédelem",
    date: "2026. február 10.",
    readTime: "7 perc",
    image: "/images/blog/gdpr-szerzodes-adatvedelem.jpg",
    color: "bg-rose-100 text-rose-700",
  },
  {
    slug: "munkaszerodes-2026-valtozasok",
    title: "Munkaszerződés 2026: változások és kötelező elemek",
    excerpt: "Az Mt. legfrissebb módosításai, a munkaszerződés kötelező tartalmi elemei, és tippek a gyakori hibák elkerüléséhez.",
    category: "Munkajog",
    date: "2026. február 5.",
    readTime: "9 perc",
    image: "/images/blog/munkaszerodes-2026-valtozasok.jpg",
    color: "bg-blue-100 text-blue-700",
  },
];

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

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  color: string;
}

export interface BlogArticle {
  title: string;
  category: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
}

export const posts: BlogPost[] = [
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

export function getArticle(slug: string): BlogArticle | undefined {
  return articles[slug];
}

export function getAllSlugs(): string[] {
  return Object.keys(articles);
}

const articles: Record<string, BlogArticle> = {
  "mesterseges-intelligencia-szerzodesek-jovo": {
    title: "Mesterséges intelligencia a szerződéskezelésben: így alakítja át az AI a jogi munkát",
    category: "Technológia",
    date: "2026. március 11.",
    readTime: "10 perc",
    image: "/images/blog/mesterseges-intelligencia-szerzodesek-jovo.jpg",
    content: `<h2>A jogi munka új korszaka</h2><p>A mesterséges intelligencia az elmúlt két évben a technológiai szektorból kilépve szinte minden iparágat elért — és a jogi szektor sem kivétel.</p>`,
  },
  "vallalkozas-inditasa-szukseges-szerzodesek": {
    title: "Vállalkozást indítasz? Ezek a szerződések kellenek az első naptól",
    category: "Útmutató",
    date: "2026. március 10.",
    readTime: "9 perc",
    image: "/images/blog/vallalkozas-inditasa-szukseges-szerzodesek.jpg",
    content: "",
  },
  "freelancer-szerzodes-szabalyok-2026": {
    title: "Freelancer vagy megbízott? Így köss szabályos szerződést 2026-ban",
    category: "Munkajog",
    date: "2026. március 9.",
    readTime: "9 perc",
    image: "/images/blog/freelancer-szerzodes-szabalyok-2026.jpg",
    content: "",
  },
  "berles-szerzodes-buktatoi-amikre-figyelj": {
    title: "Bérleti szerződés buktatói: 7 pont, amit soha ne hagyj ki",
    category: "Ingatlan",
    date: "2026. március 8.",
    readTime: "8 perc",
    image: "/images/blog/berles-szerzodes-buktatoi-amikre-figyelj.jpg",
    content: "",
  },
  "szerzodes-felmondasanak-szabalyai": {
    title: "Szerződés felmondása: mikor, hogyan és milyen következményekkel?",
    category: "Jogi útmutató",
    date: "2026. március 7.",
    readTime: "9 perc",
    image: "/images/blog/szerzodes-felmondasanak-szabalyai.jpg",
    content: "",
  },
  "elektronikus-alairas-magyarorszagon-2026": {
    title: "Elektronikus aláírás Magyarországon 2026-ban: amit tudnod kell",
    category: "Jogi útmutató",
    date: "2026. március 5.",
    readTime: "8 perc",
    image: "/images/blog/elektronikus-alairas-magyarorszagon-2026.jpg",
    content: "",
  },
  "szerzodeskezeles-kkv-digitalizacio": {
    title: "5 ok, amiért a KKV-knak digitalizálniuk kell a szerződéskezelést",
    category: "Digitalizáció",
    date: "2026. február 28.",
    readTime: "5 perc",
    image: "/images/blog/szerzodeskezeles-kkv-digitalizacio.jpg",
    content: "",
  },
  "ptk-szerzodeskotes-alapjai": {
    title: "Szerződéskötés alapjai: amit a Ptk. mond a vállalkozásoknak",
    category: "Jogi útmutató",
    date: "2026. február 20.",
    readTime: "10 perc",
    image: "/images/blog/ptk-szerzodeskotes-alapjai.jpg",
    content: "",
  },
  "nda-titoktartasi-szerzodes-minta": {
    title: "NDA / titoktartási szerződés: mikor kell és hogyan készítsd el",
    category: "Sablonok",
    date: "2026. február 15.",
    readTime: "6 perc",
    image: "/images/blog/nda-titoktartasi-szerzodes-minta.jpg",
    content: "",
  },
  "gdpr-szerzodes-adatvedelem": {
    title: "GDPR és szerződések: adatvédelmi kötelezettségek a vállalkozásodban",
    category: "Adatvédelem",
    date: "2026. február 10.",
    readTime: "7 perc",
    image: "/images/blog/gdpr-szerzodes-adatvedelem.jpg",
    content: "",
  },
  "munkaszerodes-2026-valtozasok": {
    title: "Munkaszerződés 2026: változások és kötelező elemek",
    category: "Munkajog",
    date: "2026. február 5.",
    readTime: "9 perc",
    image: "/images/blog/munkaszerodes-2026-valtozasok.jpg",
    content: "",
  },
};

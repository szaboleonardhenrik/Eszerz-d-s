export interface TestCase {
  id: string;
  title: string;
  description: string;
  steps: string[];
  expected: string;
  priority: "critical" | "high" | "medium" | "low";
}

export interface TestSection {
  id: string;
  title: string;
  icon: string;
  cases: TestCase[];
}

export const testSections: TestSection[] = [
  {
    id: "auth",
    title: "Regisztráció és Belépés",
    icon: "🔐",
    cases: [
      {
        id: "auth-register",
        title: "Regisztráció (cég)",
        description: "Új felhasználó regisztrációja céges adatokkal",
        priority: "critical",
        steps: [
          "Nyisd meg: legitas.hu/register",
          "Válaszd: \"Cég / Egyéni vállalkozó\"",
          "Töltsd ki: Név, Email, Jelszó (min 8 kar, nagybetű+szám+spec), Cégnév, Adószám (12345678-1-42)",
          "Fogadd el az ÁSZF-et",
          "Kattints \"Ingyenes regisztráció\"",
          "Ellenőrizd a postaládádat — kaptál-e verifikációs emailt",
        ],
        expected: "Sikeres regisztráció → dashboard. Email verifikáció érkezik.",
      },
      {
        id: "auth-register-personal",
        title: "Regisztráció (magánszemély)",
        description: "Regisztráció magánszemély módban, céges adatok nélkül",
        priority: "high",
        steps: [
          "Nyisd meg: legitas.hu/register",
          "Válaszd: \"Magánszemély\"",
          "Töltsd ki: Név, Email, Jelszó",
          "Fogadd el az ÁSZF-et → Regisztráció",
        ],
        expected: "Sikeres regisztráció, céges mezők nem jelennek meg.",
      },
      {
        id: "auth-login",
        title: "Bejelentkezés",
        description: "Meglévő fiókkal bejelentkezés",
        priority: "critical",
        steps: [
          "Nyisd meg: legitas.hu/login",
          "Add meg az email + jelszó",
          "Kattints \"Bejelentkezés\"",
        ],
        expected: "Sikeres bejelentkezés → dashboard.",
      },
      {
        id: "auth-logout",
        title: "Kijelentkezés",
        description: "Felhasználó kijelentkeztetése",
        priority: "high",
        steps: [
          "Jobb felső profil ikon → Kijelentkezés",
        ],
        expected: "Visszairányít a login oldalra. Védett oldalak nem elérhetők.",
      },
      {
        id: "auth-forgot",
        title: "Elfelejtett jelszó",
        description: "Jelszó-visszaállítási flow végig",
        priority: "high",
        steps: [
          "Login oldalon → \"Elfelejtett jelszó?\"",
          "Add meg az emailed → \"Jelszó-visszaállító link küldése\"",
          "Nézd az emailedet, kattints a linkre",
          "Adj meg új jelszót → Mentés",
          "Lépj be az új jelszóval",
        ],
        expected: "Email érkezik, link működik, új jelszóval be tudsz lépni.",
      },
      {
        id: "auth-bad-login",
        title: "Hibás belépési kísérlet",
        description: "Rossz jelszó/email kezelése",
        priority: "medium",
        steps: [
          "Próbálj bejelentkezni rossz jelszóval",
          "Próbálj bejelentkezni nem létező emaillel",
        ],
        expected: "\"Hibás email vagy jelszó\" — NEM árulja el melyik rossz.",
      },
      {
        id: "auth-cookie",
        title: "Cookie banner (GDPR)",
        description: "Cookie banner megjelenése, elfogadás, visszavonás",
        priority: "medium",
        steps: [
          "Incognito módban nyisd meg a főoldalt",
          "Cookie banner megjelenik? 3 gomb: Beállítások / Csak szükségesek / Elfogadom",
          "Kattints \"Csak szükségesek\"",
          "\"Cookie beállítások\" gomb megjelenik bal alul?",
          "Kattints rá → banner újra megjelenik? (GDPR visszavonás)",
        ],
        expected: "Banner működik, preference menthető, visszavonható.",
      },
    ],
  },
  {
    id: "contract",
    title: "Szerződés Kezelés",
    icon: "📝",
    cases: [
      {
        id: "contract-create-template",
        title: "Szerződés létrehozás sablonból",
        description: "Teljes 4-lépéses wizard egy sablon alapján",
        priority: "critical",
        steps: [
          "Dashboard → \"Új szerződés\"",
          "Válassz sablont (pl. Megbízási szerződés) → \"Kiválasztás\"",
          "2. lépés: Adj címet + töltsd ki MINDEN kötelező mezőt (piros *) → Tovább",
          "3. lépés: Válassz aláírási módot → add meg aláíró nevét, emailjét → Tovább",
          "4. lépés: Ellenőrizd az összegzést → \"Szerződés létrehozása\"",
        ],
        expected: "Szerződés létrejön, átirányítás a részletek oldalára, státusz: Piszkozat.",
      },
      {
        id: "contract-create-blank",
        title: "Üres szerződés létrehozás",
        description: "Szerződés sablon nélkül, fájl feltöltéssel",
        priority: "high",
        steps: [
          "Új szerződés → \"Fájl feltöltése\" tab",
          "Tölts fel egy PDF fájlt",
          "Adj címet → Tovább",
          "Aláíró hozzáadása → Létrehozás",
        ],
        expected: "Szerződés létrejön a feltöltött PDF-ből.",
      },
      {
        id: "contract-send",
        title: "Szerződés küldés aláírásra",
        description: "Piszkozat szerződés kiküldése az aláíróknak",
        priority: "critical",
        steps: [
          "Nyiss meg egy Piszkozat státuszú szerződést",
          "Kattints \"Küldés aláírásra\"",
          "Ellenőrizd: az aláíró kapott-e emailt?",
        ],
        expected: "Státusz: \"Küldve\". Aláíró kap emailt aláírási linkkel.",
      },
      {
        id: "contract-list",
        title: "Szerződés lista, keresés, szűrés",
        description: "Szerződések böngészése, keresése és szűrése",
        priority: "high",
        steps: [
          "Menj: Szerződések oldal",
          "Keresd meg egy szerződést név szerint",
          "Szűrj státusz szerint (pl. csak \"Küldve\")",
          "Kattints PDF ikonra → letöltés",
        ],
        expected: "Keresés és szűrés működik, PDF letölthető.",
      },
      {
        id: "contract-detail",
        title: "Szerződés részletek oldal",
        description: "Egyedi szerződés megtekintése, műveletek",
        priority: "high",
        steps: [
          "Kattints egy szerződésre a listában",
          "Ellenőrizd: cím, státusz, aláírók, PDF, audit log",
          "Próbáld meg: komment írás, letöltés, duplikálás",
        ],
        expected: "Minden adat megjelenik, műveletek működnek.",
      },
    ],
  },
  {
    id: "signing",
    title: "Aláírási Folyamat",
    icon: "✍️",
    cases: [
      {
        id: "sign-otp",
        title: "OTP azonosítás",
        description: "Az aláíró email-es OTP kóddal azonosítja magát",
        priority: "critical",
        steps: [
          "Nyisd meg az aláírási linket (emailből)",
          "Kattints \"Kód kérése\"",
          "Nézd az emailedet — 6 jegyű kód érkezik",
          "Írd be → \"Ellenőrzés\"",
        ],
        expected: "Sikeres azonosítás, továbblépés az adatok kitöltéséhez.",
      },
      {
        id: "sign-details",
        title: "Aláíró adatok kitöltése",
        description: "Személyes és céges adatok megadása",
        priority: "critical",
        steps: [
          "Töltsd ki: teljes név, cégnév, adószám, székhely",
          "Ha vannak sablon-mezők, azokat is töltsd ki",
          "Tovább",
        ],
        expected: "Adatok elfogadva, átlépés a szerződés olvasásra.",
      },
      {
        id: "sign-read-scroll",
        title: "Szerződés elolvasás (kötelező görgetés)",
        description: "A rendszer megköveteli a teljes szerződés elolvasását",
        priority: "high",
        steps: [
          "Olvasd el (görgess) a szerződést",
          "Próbálj továbblépni MIELŐTT alulra érnél",
          "Görgess alulra → próbálj továbblépni",
        ],
        expected: "Tovább gomb csak alulra görgetés UTÁN aktív.",
      },
      {
        id: "sign-draw",
        title: "Aláírás rajzolással",
        description: "Kézzel rajzolt aláírás a canvason",
        priority: "critical",
        steps: [
          "\"Rajzolás\" tab legyen aktív",
          "Rajzolj az egérrel/ujjaddal",
          "Próbáld a \"Törlés\" gombot",
          "Rajzolj újra → jelöld be a GDPR consent-et → \"Aláírás\"",
        ],
        expected: "Rajzolás működik, aláírás sikeres.",
      },
      {
        id: "sign-type",
        title: "Aláírás gépeléssel",
        description: "Név begépelése mint aláírás",
        priority: "high",
        steps: [
          "\"Gépelés\" tab",
          "Írd be a neved",
          "Ellenőrizd az előnézetet (dőlt serif betűtípus)",
        ],
        expected: "Begépelt név megjelenik előnézetben, aláírás működik.",
      },
      {
        id: "sign-upload",
        title: "Aláírás kép feltöltéssel",
        description: "Beszkennelt vagy fotózott aláírás kép feltöltése",
        priority: "high",
        steps: [
          "\"Feltöltés\" tab",
          "Kattints → válassz PNG/JPG képet (max 2MB)",
          "Kép megjelenik előnézetben?",
          "✕ gombbal töröld és próbáld újra",
        ],
        expected: "Kép feltöltés, előnézet, törlés és újra feltöltés működik.",
      },
      {
        id: "sign-stamp",
        title: "Pecsét feltöltés",
        description: "Opcionális bélyegző/pecsét kép hozzáadása",
        priority: "medium",
        steps: [
          "Az aláírási mód alatt keresd: \"Pecsét / Bélyegző (opcionális)\"",
          "Tölts fel egy pecsét képet",
          "Töröld (✕) és tölts fel újra",
        ],
        expected: "Pecsét kép megjelenik, törölhető, PDF-ben az aláírás mellett lesz.",
      },
      {
        id: "sign-saved",
        title: "Mentett aláírás használata (1 kattintás)",
        description: "Korábban elmentett aláírás automatikus betöltése",
        priority: "high",
        steps: [
          "Előfeltétel: Beállítások → Aláírás → mentsd el az aláírásodat",
          "Küldj magadnak egy szerződést → nyisd meg az aláírási linket",
          "Az aláírási lépésnél keresd: \"Mentett aláírás használata\" gomb",
          "Kattints rá",
        ],
        expected: "Aláírás + pecsét automatikusan betöltődik. Egy kattintás az aláíráshoz.",
      },
      {
        id: "sign-decline",
        title: "Aláírás visszautasítása",
        description: "Az aláíró visszautasítja a szerződést",
        priority: "medium",
        steps: [
          "Nyiss meg egy aláírási linket",
          "OTP után kattints \"Visszautasítás\"",
          "Adj meg okot → Küldés",
        ],
        expected: "Visszautasítás sikeres, szerződés státusz: \"Visszautasítva\".",
      },
    ],
  },
  {
    id: "templates",
    title: "Sablonok",
    icon: "📋",
    cases: [
      {
        id: "tpl-browse",
        title: "Sablon böngészés és szűrés",
        description: "A 15+ beépített sablon megtekintése",
        priority: "high",
        steps: [
          "Menj: Sablonok (bal menü)",
          "Ellenőrizd: legalább 15 sablon jelenik meg",
          "Szűrj kategória szerint (munkajogi, b2b, stb.)",
        ],
        expected: "Sablonok megjelennek, szűrés működik.",
      },
      {
        id: "tpl-preview",
        title: "Sablon előnézet",
        description: "Sablon tartalmának megtekintése a kiválasztás előtt",
        priority: "medium",
        steps: [
          "Kattints egy sablon \"Előnézet\" gombjára",
        ],
        expected: "Modal megnyílik a sablon teljes HTML tartalmával.",
      },
    ],
  },
  {
    id: "settings",
    title: "Beállítások",
    icon: "⚙️",
    cases: [
      {
        id: "settings-profile",
        title: "Profil szerkesztés",
        description: "Személyes adatok módosítása",
        priority: "high",
        steps: [
          "Beállítások → Profil",
          "Módosítsd a neved vagy cégnevet → Mentés",
        ],
        expected: "Sikeres mentés, adatok frissülnek.",
      },
      {
        id: "settings-security",
        title: "Biztonsági beállítások",
        description: "Jelszó módosítás, 2FA",
        priority: "high",
        steps: [
          "Beállítások → Biztonság",
          "Próbáld ki a jelszó módosítást",
          "Ellenőrizd a 2FA opciót",
        ],
        expected: "Jelszó módosítás működik, 2FA elérhető.",
      },
      {
        id: "settings-signature",
        title: "Mentett aláírás kezelés",
        description: "Aláírás és pecsét mentése a profilba",
        priority: "high",
        steps: [
          "Beállítások → Aláírás",
          "Rajzolj vagy tölts fel aláírást",
          "Tölts fel pecsétet (opcionális)",
          "\"Aláírás mentése\"",
          "Töröld és próbáld újra",
        ],
        expected: "Mentés, megjelenítés és törlés működik.",
      },
      {
        id: "settings-billing",
        title: "Számlázás és csomagok",
        description: "Előfizetés, kredit egyenleg megtekintése",
        priority: "medium",
        steps: [
          "Beállítások → Számlázás",
          "Ellenőrizd: csomag neve, kredit egyenleg, csomag frissítés gombok",
        ],
        expected: "Adatok megjelennek, frissítés gomb Stripe-ra visz.",
      },
      {
        id: "settings-notifications",
        title: "Értesítés beállítások",
        description: "Email értesítés preferenciák",
        priority: "low",
        steps: [
          "Beállítások → Értesítések",
          "Kapcsold ki/be az értesítés típusokat → Mentés",
        ],
        expected: "Beállítások elmentve.",
      },
    ],
  },
  {
    id: "public",
    title: "Publikus Oldalak és SEO",
    icon: "🌐",
    cases: [
      {
        id: "public-landing",
        title: "Landing page",
        description: "Főoldal design, tartalom, CTA gombok",
        priority: "high",
        steps: [
          "Nyisd meg: legitas.hu/landing",
          "Görgess végig — minden szekció betölt?",
          "CTA gombok regisztrációra visznek?",
          "Mobilon is teszteld!",
        ],
        expected: "Szép design, minden szekció betölt, gombok működnek.",
      },
      {
        id: "public-pricing",
        title: "Árak oldal",
        description: "Csomagok, árak, éves/havi váltó",
        priority: "high",
        steps: [
          "Nyisd meg: legitas.hu/pricing",
          "Éves/havi váltó működik?",
          "4 csomag megjelenik helyes árakkal?",
          "\"23% kedvezmény\" éves fizetésnél?",
        ],
        expected: "4 csomag, árak helyesek, váltó működik.",
      },
      {
        id: "public-blog",
        title: "Blog",
        description: "Blog lista és cikk oldalak",
        priority: "medium",
        steps: [
          "Nyisd meg: legitas.hu/blog",
          "Kattints egy cikkre → tartalom betölt?",
        ],
        expected: "16 cikk, mindegyik megnyitható és tartalmas.",
      },
      {
        id: "public-legal",
        title: "Jogi oldalak (ÁSZF, Adatvédelem, Cookie, Impresszum)",
        description: "Minden jogi oldal betölt és tartalmas",
        priority: "medium",
        steps: [
          "Nyisd meg: /aszf, /adatvedelem, /cookie, /impresszum",
        ],
        expected: "Mind a 4 oldal betölt magyar szöveggel.",
      },
    ],
  },
  {
    id: "mobile",
    title: "Mobil Tesztelés",
    icon: "📱",
    cases: [
      {
        id: "mobile-responsive",
        title: "Responsive design ellenőrzés",
        description: "Az összes főbb oldal mobilon is használható",
        priority: "high",
        steps: [
          "Nyisd meg TELEFONON: landing, login, register, dashboard, új szerződés",
          "Hamburger menü működik?",
          "Gombok elég nagyok?",
          "Szöveg olvasható?",
        ],
        expected: "Minden oldal responsive, mobilon is használható.",
      },
      {
        id: "mobile-sign",
        title: "Aláírás telefonon ujjal",
        description: "Rajzolás az ujjal a signing page-en",
        priority: "critical",
        steps: [
          "Nyiss meg egy aláírási linket telefonon",
          "Rajzolj az ujjaddal az aláírás mezőre",
          "A lap NEM scrollozik közben?",
        ],
        expected: "Rajzolás működik, nem scrollozza a lapot.",
      },
    ],
  },
  {
    id: "edge",
    title: "Szélsőséges Esetek és UI",
    icon: "⚡",
    cases: [
      {
        id: "edge-dark-mode",
        title: "Sötét mód",
        description: "Az összes oldal sötét módban is olvasható",
        priority: "medium",
        steps: [
          "Kattints a nap/hold ikonra a fejlécben",
          "Nézd végig: dashboard, beállítások, szerződés létrehozás",
        ],
        expected: "Minden szöveg olvasható, nincs fehér-fehér vagy fekete-fekete.",
      },
      {
        id: "edge-validation",
        title: "Form validáció",
        description: "Üres vagy hibás adatokkal beküldés",
        priority: "medium",
        steps: [
          "Próbálj regisztrálni: üres mezőkkel, rossz email formátummal, rövid jelszóval",
          "Próbálj szerződést létrehozni üres mezőkkel",
        ],
        expected: "Validációs hibaüzenetek, nem engedi tovább.",
      },
      {
        id: "edge-browsers",
        title: "Böngésző kompatibilitás",
        description: "Működés Chrome + legalább 1 másik böngészőben",
        priority: "low",
        steps: [
          "Teszteld Chrome-ban + Safari-ban VAGY Firefox-ban",
          "A legfontosabb: login, szerződés létrehozás, aláírás",
        ],
        expected: "Mindkét böngészőben ugyanúgy működik.",
      },
      {
        id: "edge-search",
        title: "Globális keresés (Ctrl+K)",
        description: "Keresés szerződések, sablonok között",
        priority: "medium",
        steps: [
          "Nyomd meg Ctrl+K (vagy Cmd+K Mac-en)",
          "Keress egy szerződés nevére",
        ],
        expected: "Keresés megnyílik, eredmények < 1 mp, kattintásra navigál.",
      },
      {
        id: "edge-speed",
        title: "Betöltési sebesség",
        description: "Oldalak gyorsan betöltenek",
        priority: "low",
        steps: [
          "Mérd le (szubjektíven): landing, dashboard, aláírás oldal",
        ],
        expected: "Minden oldal < 3 másodperc alatt betölt.",
      },
    ],
  },
];

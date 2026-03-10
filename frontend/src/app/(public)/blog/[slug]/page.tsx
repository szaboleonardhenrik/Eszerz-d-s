"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";

const articles: Record<string, { title: string; category: string; date: string; readTime: string; content: string }> = {
  "elektronikus-alairas-magyarorszagon-2026": {
    title: "Elektronikus aláírás Magyarországon 2026-ban: amit tudnod kell",
    category: "Jogi útmutató",
    date: "2026. március 5.",
    readTime: "8 perc",
    content: `
      <h2>Mi az elektronikus aláírás?</h2>
      <p>Az elektronikus aláírás (e-aláírás) olyan elektronikus adat, amelyet más elektronikus adatokhoz csatolnak vagy logikailag hozzárendelnek, és amelyet az aláíró az aláírásra használ. Az Európai Unió eIDAS rendelete (EU 910/2014) három szintet különböztet meg.</p>

      <h2>Az eIDAS rendelet három szintje</h2>
      <h3>1. Egyszerű elektronikus aláírás (SES)</h3>
      <p>A legegyszerűbb forma: lehet egy beírt név, egy checkbox kipipálása, vagy egy rajzolt aláírás a képernyőn. Jogilag érvényes a legtöbb szerződéstípusnál — a Ptk. szerint a szerződés alaki kötöttség hiányában szóban is megköthető, tehát az egyszerű e-aláírás bőven elegendő.</p>

      <h3>2. Fokozott biztonságú elektronikus aláírás (AES)</h3>
      <p>Az AES kizárólag az aláíróhoz köthető, alkalmas az aláíró azonosítására, és az aláíró kizárólagos ellenőrzése alatt álló adatokkal hozzák létre. Bármely utólagos módosítás észlelhető. Ilyen például a digitális tanúsítvánnyal készült aláírás.</p>

      <h3>3. Minősített elektronikus aláírás (QES)</h3>
      <p>A legmagasabb szint. Minősített aláírás-létrehozó eszközzel és minősített tanúsítvány alapján készül. Magyarországon a Microsec és a NISZ (korábban Netlock) szolgáltatók adnak ki ilyen tanúsítványokat. A QES teljes bizonyító erejű magánokiratnak minősül.</p>

      <h2>Mikor melyik szint kell?</h2>
      <p>A magyar jog szerint a szerződések túlnyomó többségéhez elegendő az egyszerű elektronikus aláírás. Kivételek, ahol minősített aláírás vagy írásbeli forma szükséges:</p>
      <ul>
        <li>Ingatlan adásvételi szerződés (ügyvédi ellenjegyzés is kell)</li>
        <li>Végrendelet</li>
        <li>Házassági vagyonjogi szerződés</li>
        <li>Kezességi szerződés</li>
      </ul>

      <h2>A Legitas megoldása</h2>
      <p>A Legitas mindhárom szintet támogatja. Az ingyenes csomagban egyszerű e-aláírás érhető el (rajzolt és gépelt), míg a Profi csomagban fokozott és minősített aláírás is használható DÁP és Microsec integráción keresztül.</p>
      <p>Minden aláíráshoz audit napló készül: rögzítjük az IP-címet, a böngészőt, az időbélyeget és a dokumentum SHA-256 hash-ét. Ez bizonyítási szempontból fontos lehet egy esetleges jogvitában.</p>

      <h2>Összefoglalás</h2>
      <p>2026-ban az e-aláírás már nem jövőkép, hanem napi gyakorlat. A magyar jogszabályok és az eIDAS rendelet egyaránt támogatják a digitális szerződéskötést. A kérdés már nem az, hogy „érvényes-e", hanem hogy „miért nem használod még".</p>
    `,
  },
  "szerzodeskezeles-kkv-digitalizacio": {
    title: "5 ok, amiért a KKV-knak digitalizálniuk kell a szerződéskezelést",
    category: "Digitalizáció",
    date: "2026. február 28.",
    readTime: "5 perc",
    content: `
      <h2>Miért ragaszkodunk még a papírhoz?</h2>
      <p>A magyar KKV-k jelentős része még mindig papíron kezeli a szerződéseit. Nyomtatás, aláírás, szkennelés, e-mail — ismerős? Ez a folyamat lassú, költséges és hibalehetőségekkel teli. Íme 5 meggyőző érv a váltás mellett.</p>

      <h2>1. Időmegtakarítás</h2>
      <p>Egy hagyományos szerződéskötés átlagosan 5-7 munkanapot vesz igénybe: megszövegezés, egyeztetés, nyomtatás, postázás vagy személyes találkozó, visszaküldés. Digitálisan? 10-15 perc. Az aláíró emailben kapja a linket, és mobilról is aláírhatja.</p>

      <h2>2. Költségcsökkentés</h2>
      <p>A papír, nyomtató, toner, postai díjak és archiválási költségek évente akár több százezer forintot is kitehetnek egy KKV-nál. A digitális megoldás ezeket nullára csökkenti. A Legitas ingyenes csomagjával havi 5 szerződés teljesen ingyen kezelhető.</p>

      <h2>3. Jogi biztonság</h2>
      <p>A digitális szerződéskezelő rendszerek automatikusan biztosítják, ami papíron a te felelősséged lenne: semmit nem lehet utólag módosítani (SHA-256 hash), minden lépés naplózva van (audit trail), és a sablonok jogász által ellenőrzöttek.</p>

      <h2>4. Átláthatóság és kontroll</h2>
      <p>Hol tart az aláírás? Ki írta alá, ki nem? Mikor jár le a szerződés? Papíron ezeket fejben vagy Excel-ben tartod nyilván. Egy digitális rendszerben dashboard-on látod az összes szerződésed státuszát, emlékeztetőket kapsz a lejáratokról.</p>

      <h2>5. Távmunka és rugalmasság</h2>
      <p>A home office és a távmunka ma már alap. Ha a szerződéseid papíron vannak az irodai fiókban, nem férsz hozzájuk otthonról. A felhőalapú szerződéskezelő bárhonnan elérhető, mobilról is.</p>

      <h2>Hogyan kezdj hozzá?</h2>
      <p>Nem kell egyszerre mindent digitalizálni. Kezdd az új szerződésekkel — a meglévőket fokozatosan szkenneld be és töltsd fel. A Legitas ingyenes csomagjával kockázat nélkül kipróbálhatod a rendszert.</p>
    `,
  },
  "ptk-szerzodeskotes-alapjai": {
    title: "Szerződéskötés alapjai: amit a Ptk. mond a vállalkozásoknak",
    category: "Jogi útmutató",
    date: "2026. február 20.",
    readTime: "10 perc",
    content: `
      <h2>A Polgári Törvénykönyv és a szerződések</h2>
      <p>A 2013. évi V. törvény (Ptk.) a magyar magánjog alapja. A szerződésekre vonatkozó szabályokat elsősorban a Hatodik Könyv tartalmazza. Minden vállalkozónak érdemes ismerni az alapokat.</p>

      <h2>A szerződés fogalma</h2>
      <p>A szerződés a felek kölcsönös és egybehangzó akaratnyilatkozata, amelyből kötelezettség keletkezik a szolgáltatás teljesítésére, és jogosultság a szolgáltatás követelésére (Ptk. 6:58. §). Egyszerűbben: két fél megállapodik valamiben, és ez jogilag kötelező érvényű.</p>

      <h2>Alaki követelmények</h2>
      <p>A Ptk. főszabály szerint nem ír elő alaki kötöttséget — a szerződés szóban, írásban és ráutaló magatartással is megköthető (Ptk. 6:63. §). Azonban bizonyos szerződéstípusoknál kötelező az írásbeli forma:</p>
      <ul>
        <li>Ingatlanra vonatkozó szerződések</li>
        <li>Kezességi szerződés</li>
        <li>Tartási és életjáradéki szerződés</li>
        <li>Jogszabály által előírt egyéb esetek</li>
      </ul>

      <h2>Érvénytelenség</h2>
      <p>Egy szerződés érvénytelen lehet semmisség (pl. jogszabályba ütközik, lehetetlen szolgáltatásra irányul) vagy megtámadhatóság (pl. tévedés, megtévesztés, fenyegetés) miatt. Az érvénytelenségre bármelyik fél hivatkozhat.</p>

      <h2>Szerződésszegés</h2>
      <p>Ha valamelyik fél nem teljesíti a vállalt kötelezettségét, szerződésszegést követ el. A Ptk. szerint a sérelmet szenvedett fél:</p>
      <ul>
        <li>Követelheti a teljesítést</li>
        <li>Elállhat a szerződéstől vagy felmondhatja azt</li>
        <li>Kártérítést követelhet</li>
        <li>Kötbért érvényesíthet (ha kikötötték)</li>
      </ul>

      <h2>Gyakorlati tippek vállalkozásoknak</h2>
      <p>Mindig írásbeli szerződést kössetek — még ha a jog nem is követeli meg. Az írásbeli forma bizonyítási szempontból sokkal erősebb. Használjatok előre elkészített, jogász által ellenőrzött sablonokat, és ne felejtsetek el minden lényeges feltételt rögzíteni: felek adatai, szolgáltatás leírása, díjazás, határidők, felmondási feltételek.</p>
    `,
  },
  "nda-titoktartasi-szerzodes-minta": {
    title: "NDA / titoktartási szerződés: mikor kell és hogyan készítsd el",
    category: "Sablonok",
    date: "2026. február 15.",
    readTime: "6 perc",
    content: `
      <h2>Mi az NDA?</h2>
      <p>Az NDA (Non-Disclosure Agreement), magyarul titoktartási szerződés vagy titoktartási nyilatkozat, olyan megállapodás, amelyben a felek vállalják, hogy az egymással megosztott bizalmas információkat nem hozzák nyilvánosságra és nem használják fel jogosulatlanul.</p>

      <h2>Mikor van szükség NDA-ra?</h2>
      <ul>
        <li><strong>Üzleti tárgyalások előtt</strong> — ha üzleti tervet, árazást vagy stratégiát osztasz meg egy potenciális partnerrel</li>
        <li><strong>Munkavállalók felvételekor</strong> — különösen ha hozzáférnek ügyféladatokhoz, forráskódhoz vagy üzleti titkokhoz</li>
        <li><strong>Szoftverfejlesztésnél</strong> — ha külsős fejlesztőknek adsz hozzáférést a rendszeredhez</li>
        <li><strong>Befektetés-szerzésnél</strong> — a pitch deck és a pénzügyi adatok védelme érdekében</li>
      </ul>

      <h2>Mit tartalmazzon egy jó NDA?</h2>
      <p>Egy jól megírt NDA a következő elemeket tartalmazza:</p>
      <ul>
        <li><strong>Felek meghatározása</strong> — ki az információt átadó és ki a fogadó fél</li>
        <li><strong>Bizalmas információ definíciója</strong> — mit tekintünk bizalmasnak (minél konkrétabb, annál jobb)</li>
        <li><strong>Kivételek</strong> — mi nem minősül bizalmas információnak (pl. nyilvánosan elérhető adatok)</li>
        <li><strong>Időtartam</strong> — meddig áll fenn a titoktartási kötelezettség (általában 2-5 év)</li>
        <li><strong>Szankciók</strong> — mi történik jogsértés esetén (kötbér, kártérítés)</li>
      </ul>

      <h2>Egyoldalú vs. kétoldalú NDA</h2>
      <p>Az egyoldalú NDA-ban csak az egyik fél ad át bizalmas információt (pl. munkáltató → munkavállaló). A kétoldalú (mutual) NDA mindkét felet védi — ez a gyakoribb üzleti tárgyalásoknál.</p>

      <h2>NDA készítése a Legitason</h2>
      <p>A Legitason kétoldalú NDA sablon áll rendelkezésre. Válaszd ki a sablont, töltsd ki a felek adatait és a specifikus feltételeket, majd küldd el aláírásra. Az egész folyamat 5 perc.</p>
    `,
  },
  "gdpr-szerzodes-adatvedelem": {
    title: "GDPR és szerződések: adatvédelmi kötelezettségek a vállalkozásodban",
    category: "Adatvédelem",
    date: "2026. február 10.",
    readTime: "7 perc",
    content: `
      <h2>Miért fontos a GDPR a szerződéseidben?</h2>
      <p>A GDPR (General Data Protection Regulation, EU 2016/679) 2018 óta hatályos, és minden EU-ban működő vállalkozásra vonatkozik. Ha a szerződéseid személyes adatokat tartalmaznak — és szinte mindig tartalmaznak —, akkor adatvédelmi szempontból is megfelelőnek kell lenniük.</p>

      <h2>Adatkezelési záradék a szerződésekben</h2>
      <p>Minden olyan szerződésben, ahol személyes adatokat kezeltek, érdemes adatkezelési záradékot elhelyezni. Ez tartalmazza:</p>
      <ul>
        <li>Milyen személyes adatokat kezeltek (név, e-mail, cím stb.)</li>
        <li>Mi a jogalapja az adatkezelésnek (szerződés teljesítése, jogos érdek, hozzájárulás)</li>
        <li>Meddig tároljátok az adatokat</li>
        <li>Az érintettek jogai (hozzáférés, törlés, hordozhatóság)</li>
      </ul>

      <h2>Adatfeldolgozói megállapodás (DPA)</h2>
      <p>Ha egy külső szolgáltatóval (pl. könyvelő, felhőszolgáltató, marketing ügynökség) osztasz meg személyes adatokat, a GDPR 28. cikke szerint kötelező adatfeldolgozói megállapodást (Data Processing Agreement) kötni. Ennek tartalmaznia kell:</p>
      <ul>
        <li>Az adatfeldolgozás tárgyát és időtartamát</li>
        <li>A feldolgozás jellegét és célját</li>
        <li>Az érintetti adatok típusait</li>
        <li>Az adatkezelő utasítási jogát</li>
        <li>Biztonsági intézkedéseket</li>
        <li>Al-adatfeldolgozók bevonásának feltételeit</li>
      </ul>

      <h2>Munkaszerződések és a GDPR</h2>
      <p>A munkaszerződésekben is szerepelnie kell adatvédelmi tájékoztatásnak. A munkavállalókat informálni kell arról, hogy milyen adataikat, milyen célból és meddig kezeled. Ez külön mellékletként vagy a szerződés részeként is megoldható.</p>

      <h2>Szankciók</h2>
      <p>A GDPR megsértéséért a NAIH (Nemzeti Adatvédelmi és Információszabadság Hatóság) komoly bírságot szabhat ki — akár az éves árbevétel 4%-áig. KKV-k számára is akár milliós nagyságrendű büntetés lehetséges.</p>

      <h2>A Legitas és a GDPR</h2>
      <p>A Legitas sablonjai tartalmazzák a szükséges adatvédelmi záradékokat. Az adatfeldolgozói megállapodás sablon is elérhető. A platform maga is GDPR-kompatibilis: EU szerveren tárolunk, audit naplót vezetünk, és az adatok bármikor törölhetők.</p>
    `,
  },
  "munkaszerodes-2026-valtozasok": {
    title: "Munkaszerződés 2026: változások és kötelező elemek",
    category: "Munkajog",
    date: "2026. február 5.",
    readTime: "9 perc",
    content: `
      <h2>A munkaszerződés alapjai</h2>
      <p>A munkaszerződés a Munka Törvénykönyve (2012. évi I. törvény) szerint a munkaviszony létesítésének alapfeltétele. Írásbeli formában kell megkötni — ez alól nincs kivétel.</p>

      <h2>Kötelező tartalmi elemek</h2>
      <p>A munkaszerződésnek legalább az alábbiakat kell tartalmaznia:</p>
      <ul>
        <li><strong>Alapbér</strong> — a bruttó havi (vagy óra-) bér összege</li>
        <li><strong>Munkakör</strong> — a végzendő munka megnevezése</li>
        <li><strong>Munkavégzés helye</strong> — a telephely címe (távmunka esetén a távmunkavégzés tényét is rögzíteni kell)</li>
      </ul>

      <h2>Ajánlott, de nem kötelező elemek</h2>
      <p>A gyakorlatban érdemes a következőket is rögzíteni:</p>
      <ul>
        <li>A munkaviszony kezdete és (ha határozott idejű) vége</li>
        <li>Próbaidő tartama (max. 3 hónap)</li>
        <li>Munkaidő beosztása</li>
        <li>Szabadság mértéke</li>
        <li>Felmondási idő</li>
        <li>Versenytilalmi megállapodás</li>
        <li>Titoktartási kötelezettség</li>
      </ul>

      <h2>2026-os változások</h2>
      <p>A legfrissebb módosítások között szerepel:</p>
      <ul>
        <li><strong>Minimálbér emelés:</strong> 2026-ban a garantált bérminimum és a minimálbér is emelkedett — a munkaszerződéseket ennek megfelelően kell módosítani</li>
        <li><strong>Távmunka szabályozás:</strong> pontosított szabályok a home office keretmegállapodásokra vonatkozóan</li>
        <li><strong>Atipikus foglalkoztatás:</strong> egyszerűsített szabályok a platformmunkára és a gig economy-ra</li>
      </ul>

      <h2>Gyakori hibák</h2>
      <p>A leggyakoribb hibák a munkaszerződéseknél:</p>
      <ul>
        <li>Nem írásbeli megkötés (érvénytelen!)</li>
        <li>Hiányzó kötelező elemek (alapbér, munkakör, munkavégzés helye)</li>
        <li>Próbaidő túllépése (max. 3 hónap, határozott idejű szerződésnél arányos)</li>
        <li>Minimálbér alatti bér rögzítése</li>
        <li>Jogellenes versenytilalmi kikötés (kompenzáció nélkül)</li>
      </ul>

      <h2>Munkaszerződés a Legitason</h2>
      <p>A Legitason határozatlan és határozott idejű munkaszerződés sablon is elérhető, a 2026-os jogszabályoknak megfelelően. A sablon automatikusan tartalmazza a kötelező elemeket, és figyelmeztet, ha valami hiányzik.</p>
    `,
  },
};

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles[slug];

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

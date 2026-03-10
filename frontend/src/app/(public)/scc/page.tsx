import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TIA / SCC - SzerződésPortál",
  description: "Nemzetközi Adattovábbítási Értékelés és Standard Contractual Clauses dokumentáció",
};

export default function SccPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Nemzetközi Adattovábbítási Értékelés (TIA)</h1>
      <p className="text-lg text-gray-500 mb-2">Standard Contractual Clauses (SCC) dokumentáció</p>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 7.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark">
        <h2>1. Bevezetés</h2>
        <p>
          A SzerződésPortál platform bizonyos szolgáltatásaihoz az Európai Gazdasági Térségen (EGT)
          kívüli, egyesült államokbeli adatfeldolgozókat vesz igénybe. A GDPR 46. cikk (2) c) pontja
          és a Schrems II ítélet (C-311/18) alapján az alábbi értékelést készítettük az adattovábbítás
          jogszerűségéről és biztonságáról.
        </p>

        <h2>2. Érintett adattovábbítások</h2>

        <h3>2.1 Anthropic (AI elemzés)</h3>
        <ul>
          <li><strong>Szolgáltató:</strong> Anthropic, PBC (San Francisco, CA, USA)</li>
          <li><strong>Továbbított adatok:</strong> Szerződés szövege (kizárólag az AI elemzés időtartamára)</li>
          <li><strong>Továbbítás célja:</strong> AI-alapú szerződéselemzés és kockázatértékelés</li>
          <li><strong>Továbbítás jogalapja:</strong> Felhasználó kifejezett hozzájárulása (GDPR 6. cikk (1) a))</li>
          <li><strong>Adatmegőrzés:</strong> Az Anthropic nem tárolja a feldolgozott adatokat (API Terms of Service)</li>
          <li><strong>Védelem:</strong> SCC (EU 2021/914), API TLS 1.2+ titkosítás</li>
        </ul>
        <p>Kiegészítő intézkedések:</p>
        <ul>
          <li>Felhasználó tájékoztatása az adattovábbításról az elemzés előtt</li>
          <li>Hozzájárulás szükséges az AI elemzés indításához</li>
          <li>A szerződésszöveg nem kerül tárolásra az Anthropic rendszerében</li>
          <li>API kommunikáció TLS 1.2+ titkosítással</li>
        </ul>

        <h3>2.2 Stripe, Inc. (fizetésfeldolgozás)</h3>
        <ul>
          <li><strong>Szolgáltató:</strong> Stripe, Inc. (San Francisco, CA, USA)</li>
          <li><strong>Továbbított adatok:</strong> Ügyfél email, név, Stripe Customer ID</li>
          <li><strong>Továbbítás célja:</strong> Előfizetés kezelés, fizetésfeldolgozás</li>
          <li><strong>Továbbítás jogalapja:</strong> Szerződés teljesítése (GDPR 6. cikk (1) b))</li>
          <li><strong>Védelem:</strong> SCC (EU 2021/914), PCI DSS Level 1 tanúsítvány</li>
          <li><strong>Stripe DPA:</strong> Automatikusan érvényes, tartalmazza az SCC-t</li>
        </ul>
        <p>Kiegészítő intézkedések:</p>
        <ul>
          <li>Minimális adattovábbítás (csak email, név, customer ID)</li>
          <li>Bankkártya adatok közvetlenül a Stripe-nál maradnak</li>
          <li>PCI DSS Level 1 compliance</li>
        </ul>

        <h3>2.3 Resend, Inc. (email küldés)</h3>
        <ul>
          <li><strong>Szolgáltató:</strong> Resend, Inc. (USA)</li>
          <li><strong>Továbbított adatok:</strong> Címzett email cím, név, email tartalom</li>
          <li><strong>Továbbítás célja:</strong> Tranzakciós és értesítő emailek küldése</li>
          <li><strong>Továbbítás jogalapja:</strong> Szerződés teljesítése / jogos érdek</li>
          <li><strong>Védelem:</strong> SCC (EU 2021/914), DPA aláírva</li>
        </ul>
        <p>Kiegészítő intézkedések:</p>
        <ul>
          <li>Email tartalom minimalizálása</li>
          <li>Leiratkozási lehetőség nem-kritikus emailekből</li>
          <li>TLS titkosítás az email továbbításkor</li>
        </ul>

        <h2>3. Az USA jogrendszer értékelése (Schrems II)</h2>

        <h3>3.1 Azonosított kockázatok</h3>
        <ul>
          <li><strong>FISA 702:</strong> A szolgáltatókra vonatkozhat kormányzati adathozzáférési kérelem</li>
          <li><strong>EO 12333:</strong> Tömeges adatgyűjtési lehetőség a tranzit adatokra</li>
        </ul>

        <h3>3.2 Kockázatcsökkentés</h3>
        <ul>
          <li>Az Anthropic-nak továbbított adatok átmeneti jellegűek (nem tárolódnak)</li>
          <li>A Stripe PCI DSS Level 1 minősítéssel rendelkezik, az adathozzáférés minimális</li>
          <li>A Resend tranzakciós email szolgáltatás, az email tartalom rövid megőrzési idejű</li>
          <li>Minden továbbítás TLS 1.2+ titkosítással történik</li>
          <li>A platformon kezelt adatok túlnyomó többsége az EU-n belül marad (Hetzner, Cloudflare R2 EU)</li>
        </ul>

        <h3>3.3 Értékelés eredménye</h3>
        <p>
          A kiegészítő intézkedésekkel együtt az adattovábbítások megfelelő szintű védelmet biztosítanak.
          A továbbított adatok köre és jellege minimális, az átmeneti feldolgozás csökkenti a kormányzati
          hozzáférés kockázatát.
        </p>

        <h2>4. EU-n belüli adatfeldolgozók</h2>

        <h3>4.1 Hetzner Online GmbH (szerver infrastruktúra)</h3>
        <ul>
          <li><strong>Székhely:</strong> Gunzenhausen, Németország</li>
          <li><strong>Adatok:</strong> Teljes adatbázis, fájlok</li>
          <li><strong>GDPR:</strong> EU-n belüli feldolgozás, német adatvédelmi jog</li>
          <li><strong>DPA:</strong> Hetzner standard DPA</li>
        </ul>

        <h3>4.2 Cloudflare R2 (dokumentumtárolás)</h3>
        <ul>
          <li><strong>Régió:</strong> EU</li>
          <li><strong>Adatok:</strong> PDF dokumentumok, aláírás képek</li>
          <li><strong>GDPR:</strong> EU régiós tárolás konfigurálva</li>
          <li><strong>DPA:</strong> Cloudflare DPA</li>
        </ul>

        <h2>5. Kiegészítő biztonsági intézkedések összefoglalása</h2>

        <h3>Technikai</h3>
        <ul>
          <li>End-to-end TLS 1.2+ titkosítás minden adattovábbításnál</li>
          <li>At-rest titkosítás az EU-s tárhelyeken</li>
          <li>API kulcsok hash-elése, nem visszafejthető tárolás</li>
          <li>httpOnly, secure cookie-k</li>
          <li>Kétfaktoros hitelesítés</li>
        </ul>

        <h3>Szervezeti</h3>
        <ul>
          <li>Adatminimalizálás elve minden továbbításnál</li>
          <li>Rendszeres felülvizsgálat (legalább évente)</li>
          <li>Incidenskezelési terv (72 órás NAIH értesítés)</li>
          <li>Felhasználói tájékoztatás és hozzájárulás</li>
        </ul>

        <h3>Szerződéses</h3>
        <ul>
          <li>Standard Contractual Clauses (EU 2021/914) minden USA feldolgozóval</li>
          <li>Data Processing Agreement minden feldolgozóval</li>
          <li>14 napos értesítés új alfeldolgozó bevonása előtt</li>
        </ul>

        <h2>6. Felülvizsgálat</h2>
        <p>
          Ez a dokumentum évente, vagy az adatfeldolgozók változása, illetve jogszabályi változás
          esetén felülvizsgálandó.
        </p>
        <p><strong>Következő felülvizsgálat:</strong> 2027. március 7.</p>
        <p>
          <strong>Készítette:</strong> Szabó Leonárd Henrik<br />
          <strong>Dátum:</strong> 2026. március 7.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 7. | SzerződésPortál &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

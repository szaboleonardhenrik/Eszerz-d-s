import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie (Süti) Szabályzat - Legitas",
  description: "A Legitas cookie (süti) szabályzata",
};

export default function CookiePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Cookie (Süti) Szabályzat</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
        <h2>1. Mi az a cookie (süti)?</h2>
        <p>
          A cookie (süti) egy kis méretű szöveges fájl, amelyet a weboldal a böngésződben tárol.
          A cookie-k lehetővé teszik, hogy a weboldal felismerje a visszatérő látogatókat,
          megjegyezze a beállításaikat, és javítsa a felhasználói élményt.
        </p>

        <h3>1.1. Cookie hozzájárulás kezelése</h3>
        <p>
          A Platform első látogatásakor egy cookie banner jelenik meg, amely két lehetőséget kínál:
          „Elfogadom" (minden cookie engedélyezése) és „Csak szükségesek" (csak a szükséges cookie-k).
          A nem szükséges cookie-k (funkcionális) kizárólag az „Elfogadom" gombra kattintás után kerülnek
          elhelyezésre.
        </p>

        <h2>2. Milyen cookie-kat használunk?</h2>

        <h3>2.1. Feltétlenül szükséges cookie-k</h3>
        <p>
          Ezek a cookie-k elengedhetetlenek a weboldal alapvető működéséhez. Nélkülük a
          Szolgáltatás nem használható. Ezekhez nem szükséges hozzájárulás.
        </p>
        <table>
          <thead>
            <tr><th>Cookie neve</th><th>Cél</th><th>Lejárat</th></tr>
          </thead>
          <tbody>
            <tr><td>session_id</td><td>Munkamenet azonosítása</td><td>Munkamenet végéig</td></tr>
            <tr><td>jwt_token</td><td>Felhasználó hitelesítése (bejelentkezés)</td><td>30 nap</td></tr>
            <tr><td>csrf_token</td><td>CSRF támadások elleni védelem</td><td>Munkamenet végéig</td></tr>
            <tr><td>cookie_consent</td><td>Cookie-hozzájárulás állapotának tárolása</td><td>1 év</td></tr>
          </tbody>
        </table>

        <h3>2.2. Funkcionális cookie-k</h3>
        <p>
          Ezek a cookie-k lehetővé teszik, hogy a weboldal megjegyezze a felhasználói
          beállításokat (pl. nyelv, megjelenés). Ezek nélkül bizonyos funkciók nem
          működnek megfelelően.
        </p>
        <table>
          <thead>
            <tr><th>Cookie neve</th><th>Cél</th><th>Lejárat</th></tr>
          </thead>
          <tbody>
            <tr><td>theme</td><td>Világos/sötét téma preferencia</td><td>1 év</td></tr>
            <tr><td>sidebar_state</td><td>Oldalsáv nyitott/zárt állapota</td><td>30 nap</td></tr>
          </tbody>
        </table>

        <h3>2.3. Analitikai cookie-k</h3>
        <p>
          Jelenleg <strong>nem használunk</strong> harmadik féltől származó analitikai
          cookie-kat (pl. Google Analytics). Ha a jövőben bevezetjük, erről előzetesen
          tájékoztatjuk felhasználóinkat, és hozzájárulást kérünk.
        </p>

        <h3>2.4. Marketing cookie-k</h3>
        <p>
          Jelenleg <strong>nem használunk</strong> marketing vagy célzott hirdetési cookie-kat.
        </p>

        <h2>3. Harmadik féltől származó cookie-k</h2>
        <p>
          A Legitas az alábbi harmadik féltől származó szolgáltatásokat használja,
          amelyek saját cookie-kat helyezhetnek el:
        </p>
        <table>
          <thead>
            <tr><th>Szolgáltató</th><th>Cél</th><th>Adatvédelmi szabályzat</th></tr>
          </thead>
          <tbody>
            <tr><td>Stripe</td><td>Fizetéskezelés (csak fizetéskor)</td><td>stripe.com/privacy</td></tr>
            <tr><td>Cloudflare</td><td>Biztonsági védelem, CDN</td><td>cloudflare.com/privacypolicy</td></tr>
          </tbody>
        </table>

        <h3>3.1. Cloudflare cookie-k</h3>
        <p>
          A Cloudflare az alábbi sütiket helyezheti el:
        </p>
        <ul>
          <li><strong>__cf_bm:</strong> Bot-felismerő süti (élettartam: 30 perc)</li>
          <li><strong>cf_clearance:</strong> Biztonsági ellenőrzés eredménye (élettartam: max. 15 perc)</li>
        </ul>
        <p>
          Ezek a sütik a weboldal biztonsága érdekében szükségesek és nem igényelnek hozzájárulást.
        </p>

        <h3>3.2. Stripe cookie-k</h3>
        <p>
          A Stripe fizetési szolgáltató az alábbi sütiket használhatja a fizetési oldalon:
        </p>
        <ul>
          <li><strong>__stripe_mid:</strong> Eszközazonosító a csalásmegelőzéshez (élettartam: 1 év)</li>
          <li><strong>__stripe_sid:</strong> Munkamenet-azonosító (élettartam: 30 perc)</li>
        </ul>
        <p>
          Ezek kizárólag a fizetési tranzakció során aktívak és a PCI DSS szabvány részét képezik.
        </p>

        <h2>4. Cookie-k kezelése</h2>
        <p>A cookie-k kezelésére az alábbi lehetőségeid vannak:</p>

        <h3>4.1. Böngésző beállítások</h3>
        <p>A legtöbb böngészőben lehetőséged van a cookie-k kezelésére:</p>
        <ul>
          <li><strong>Google Chrome:</strong> Beállítások → Adatvédelem és biztonság → Cookie-k</li>
          <li><strong>Mozilla Firefox:</strong> Beállítások → Adatvédelem és biztonság → Cookie-k és webhelyadatok</li>
          <li><strong>Safari:</strong> Beállítások → Adatvédelem → Cookie-k kezelése</li>
          <li><strong>Microsoft Edge:</strong> Beállítások → Cookie-k és webhelyadatok</li>
        </ul>
        <p>
          <strong>Figyelem:</strong> Ha letiltod a szükséges cookie-kat, a Legitas
          egyes funkciói nem fognak megfelelően működni (pl. nem tudsz bejelentkezni).
        </p>

        <h3>4.2. Cookie-hozzájárulás visszavonása</h3>
        <p>
          A funkcionális cookie-kra adott hozzájárulásodat bármikor visszavonhatod a böngésző
          cookie-beállításaiban, vagy töröld a böngésző cookie-jait.
        </p>
        <p>
          Hozzájárulás visszavonása: A cookie-beállítások bármikor módosíthatók a böngésző beállításaiban
          a fent leírt módon, illetve a sütik törölhetők. A „cookie_consent" elem a böngésző
          localStorage-ából való törlésével a cookie banner újra megjelenik a következő látogatáskor.
        </p>

        <h2>5. Jogalap</h2>
        <p>A cookie-k használatának jogalapja:</p>
        <ul>
          <li>
            <strong>Feltétlenül szükséges cookie-k:</strong> Jogos érdek (GDPR 6. cikk (1) f) —
            a Szolgáltatás működéséhez elengedhetetlenek
          </li>
          <li>
            <strong>Funkcionális cookie-k:</strong> Hozzájárulás (GDPR 6. cikk (1) a) —
            a felhasználó által az első látogatáskor megadott hozzájárulás alapján
          </li>
        </ul>

        <h3>5.1. Helyi tárolás (localStorage)</h3>
        <p>
          A Platform a cookie-k mellett a böngésző helyi tárhelyét (localStorage) is használja a következő
          adatok tárolására: cookie_consent (hozzájárulási állapot), theme (témabeállítás), sidebar_state
          (oldalsáv állapota). Ezek az adatok kizárólag a böngészőben tárolódnak és nem kerülnek továbbításra
          a szerverre.
        </p>

        <h2>6. Adatmegőrzés</h2>
        <p>
          A cookie-k a fent megjelölt lejárati időig tárolódnak a böngésződben.
          A munkamenet-cookie-k a böngésző bezárásakor automatikusan törlődnek.
          Az állandó cookie-k a megadott lejáratig maradnak, hacsak korábban nem törlöd őket.
        </p>

        <h2>7. Az érintett jogai</h2>
        <p>
          A cookie-kkal kapcsolatos adatkezelésre a GDPR és az Info tv. vonatkozó rendelkezései
          az irányadók. Jogaidról részletes tájékoztatás az{" "}
          <a href="/adatvedelem" className="text-brand-teal-dark hover:underline">
            Adatvédelmi Tájékoztatóban
          </a>{" "}
          található.
        </p>

        <h2>8. Módosítások</h2>
        <p>
          Jelen Cookie Szabályzatot szükség esetén módosítjuk, különösen ha új típusú
          cookie-kat vezetünk be. A módosításokról a weboldalon tájékoztatjuk
          felhasználóinkat.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

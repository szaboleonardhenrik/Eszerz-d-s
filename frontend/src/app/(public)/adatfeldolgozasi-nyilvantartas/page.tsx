import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatfeldolgozási Nyilvántartás - Legitas",
  description: "GDPR 30. cikk szerinti adatkezelési tevékenységek nyilvántartása",
};

export default function DataProcessingRegisterPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Adatkezelési tevékenységek nyilvántartása
      </h1>
      <p className="text-sm text-gray-400 mb-4">
        GDPR 30. cikk szerinti nyilvántartás
      </p>
      <p className="text-sm text-gray-500 mb-10">Hatályos: 2026. március 12.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
        <h2>1. Adatkezelő adatai</h2>
        <ul>
          <li><strong>Név:</strong> T-DIGITAL Solutions Kft. (Legitas)</li>
          <li><strong>Székhely:</strong> 1117 Budapest, Nándorfejérvári út 32. 1. em. 4. ajtó</li>
          <li><strong>Adószám:</strong> 32526620-2-43</li>
          <li><strong>Képviselő:</strong> Yilmaz Attila Zoltán ügyvezető</li>
          <li><strong>E-mail:</strong> info@legitas.hu</li>
        </ul>

        <h2>2. Adatkezelési tevékenységek</h2>

        <h3>2.1. Felhasználói regisztráció és fiókkezelés</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Regisztrált felhasználók</td></tr>
            <tr><td>Adatkategóriák</td><td>Név, e-mail, jelszó (hash), cégnév, adószám, telefonszám</td></tr>
            <tr><td>Jogalap</td><td>Szerződés teljesítése (GDPR 6(1)(b))</td></tr>
            <tr><td>Cél</td><td>Felhasználói fiók létrehozása és kezelése</td></tr>
            <tr><td>Megőrzési idő</td><td>Fiók törléséig + 30 nap; számviteli adatok: + 8 év</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Hetzner (szerver), Google (OAuth)</td></tr>
          </tbody>
        </table>

        <h3>2.2. Szerződéskezelés és e-aláírás</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Felhasználók és aláírók (szerződéspartnerek)</td></tr>
            <tr><td>Adatkategóriák</td><td>Szerződés tartalma, aláíró neve, e-mailje, aláíráskép, IP, böngésző, céges adatok</td></tr>
            <tr><td>Jogalap</td><td>Szerződés teljesítése (GDPR 6(1)(b)); Jogos érdek (GDPR 6(1)(f))</td></tr>
            <tr><td>Cél</td><td>Online szerződéskötés, e-aláírás, dokumentumhitelesítés</td></tr>
            <tr><td>Megőrzési idő</td><td>Fiók törléséig + 30 nap</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Hetzner (szerver), Cloudflare R2 (dokumentumtárolás), Resend (e-mail)</td></tr>
          </tbody>
        </table>

        <h3>2.3. AI-alapú szerződéselemzés</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Felhasználók (akik elemzést kérnek)</td></tr>
            <tr><td>Adatkategóriák</td><td>Szerződés szöveges tartalma (ideiglenes)</td></tr>
            <tr><td>Jogalap</td><td>Hozzájárulás (GDPR 6(1)(a))</td></tr>
            <tr><td>Cél</td><td>Kockázatelemzés, javaslatok generálása</td></tr>
            <tr><td>Megőrzési idő</td><td>Nem kerül tartós tárolásra (kizárólag elemzés idejére)</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Anthropic (Claude AI, USA — SCC alapján)</td></tr>
          </tbody>
        </table>

        <h3>2.4. Audit naplózás</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Felhasználók, aláírók</td></tr>
            <tr><td>Adatkategóriák</td><td>IP cím, böngésző user agent, művelettípus, dokumentum hash, időbélyeg</td></tr>
            <tr><td>Jogalap</td><td>Jogos érdek (GDPR 6(1)(f)) — biztonság, visszaélés-megelőzés</td></tr>
            <tr><td>Cél</td><td>Biztonsági naplózás, aláírás-hitelesítés, vitarendezés</td></tr>
            <tr><td>Megőrzési idő</td><td>2 év (utána anonimizálva)</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Hetzner (szerver)</td></tr>
          </tbody>
        </table>

        <h3>2.5. E-mail értesítések</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Felhasználók, aláírók</td></tr>
            <tr><td>Adatkategóriák</td><td>Név, e-mail cím, e-mail tartalom</td></tr>
            <tr><td>Jogalap</td><td>Szerződés teljesítése (GDPR 6(1)(b))</td></tr>
            <tr><td>Cél</td><td>Aláírási meghívók, emlékeztetők, visszaigazolások</td></tr>
            <tr><td>Megőrzési idő</td><td>Resend szolgáltató megőrzési politikája szerint</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Resend Inc. (USA — SCC alapján)</td></tr>
          </tbody>
        </table>

        <h3>2.6. Fizetéskezelés</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Fizető felhasználók</td></tr>
            <tr><td>Adatkategóriák</td><td>Név, e-mail, Stripe Customer ID (bankkártya adatok a Stripe-nál maradnak)</td></tr>
            <tr><td>Jogalap</td><td>Szerződés teljesítése (GDPR 6(1)(b))</td></tr>
            <tr><td>Cél</td><td>Előfizetés és fizetéskezelés</td></tr>
            <tr><td>Megőrzési idő</td><td>Előfizetés végéig + számviteli célból 8 év</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Stripe Inc. (USA — SCC, PCI DSS Level 1)</td></tr>
          </tbody>
        </table>

        <h3>2.7. Partnernyilvántartás</h3>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Érintettek köre</td><td>Az aláírók / üzleti partnerek</td></tr>
            <tr><td>Adatkategóriák</td><td>Név, e-mail, cégnév, adószám, cím, telefonszám</td></tr>
            <tr><td>Jogalap</td><td>Hozzájárulás (GDPR 6(1)(a)) — aláíró hozzájárulása az aláírási oldalon</td></tr>
            <tr><td>Cél</td><td>Üzleti kapcsolattartás, jövőbeli szerződéskötés megkönnyítése</td></tr>
            <tr><td>Megőrzési idő</td><td>Fiók törléséig vagy érintett törlési kéréséig</td></tr>
            <tr><td>Adatfeldolgozók</td><td>Hetzner (szerver)</td></tr>
          </tbody>
        </table>

        <h2>3. Adatfeldolgozók jegyzéke</h2>
        <table>
          <thead>
            <tr><th>Adatfeldolgozó</th><th>Székhely</th><th>Tevékenység</th><th>Garancia</th></tr>
          </thead>
          <tbody>
            <tr><td>Hetzner Online GmbH</td><td>Gunzenhausen, Németország (EU)</td><td>Szerver infrastruktúra</td><td>GDPR, EU adattárolás</td></tr>
            <tr><td>Cloudflare Inc. (R2)</td><td>EU régió</td><td>Dokumentumtárolás</td><td>GDPR, DPA</td></tr>
            <tr><td>Resend Inc.</td><td>USA</td><td>E-mail küldés</td><td>SCC (EU 2021/914)</td></tr>
            <tr><td>Stripe Inc.</td><td>USA</td><td>Fizetéskezelés</td><td>SCC, PCI DSS Level 1</td></tr>
            <tr><td>Anthropic PBC</td><td>USA</td><td>AI szerződéselemzés</td><td>SCC, adatot nem tárol</td></tr>
            <tr><td>Google LLC</td><td>USA</td><td>OAuth hitelesítés</td><td>EU megfelelőségi határozat</td></tr>
          </tbody>
        </table>

        <h2>4. Technikai és szervezési intézkedések</h2>
        <ul>
          <li>HTTPS (TLS 1.3) titkosított adatátvitel</li>
          <li>Jelszavak bcrypt-12 hash-sel tárolva</li>
          <li>Dokumentumok SHA-256 integritásvédelemmel</li>
          <li>EU-ban található szerveren történő adattárolás</li>
          <li>Hozzáférés-korlátozás (JWT, API kulcsok hash-elve)</li>
          <li>Teljes körű audit napló</li>
          <li>Kétfaktoros hitelesítés (TOTP) támogatás</li>
          <li>httpOnly, secure, sameSite cookie-k</li>
          <li>CORS korlátozás</li>
          <li>Napi automatikus mentés</li>
        </ul>

        <h2>5. Nemzetközi adattovábbítások</h2>
        <p>
          EU-n kívüli adattovábbítás kizárólag az EU Bizottság által jóváhagyott
          Standard Contractual Clauses (SCC, EU 2021/914) alapján történik.
          Részletes Transfer Impact Assessment a{" "}
          <a href="/scc" className="text-[#198296] underline">TIA/SCC oldalon</a> érhető el.
        </p>

        <h2>6. Felülvizsgálat</h2>
        <p>
          Jelen nyilvántartás évente, vagy lényeges változás esetén felülvizsgálatra kerül.
          Következő tervezett felülvizsgálat: 2027. március 12.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 12. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatvédelmi Hatásvizsgálat (DPIA) - SzerződésPortál",
  description: "A SzerződésPortál adatvédelmi hatásvizsgálata a GDPR 35. cikk alapján",
};

export default function DpiaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Adatvédelmi Hatásvizsgálat (DPIA)</h1>
      <p className="text-sm text-gray-500 mb-1">GDPR 35. cikk alapján</p>
      <p className="text-sm text-gray-400 mb-1">Hatályos: 2026. március 7.</p>
      <p className="text-sm text-gray-400 mb-10">Készítette: Szabó Leonárd Henrik e.v.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark">
        <h2>1. A vizsgálat célja</h2>
        <p>
          Az adatvédelmi hatásvizsgálat célja a SzerződésPortál platform adatkezelési tevékenységeinek
          értékelése, különös tekintettel a magas kockázatú adatfeldolgozási műveletekre.
        </p>

        <h2>2. Az adatkezelés leírása</h2>

        <h3>2.1 Az adatkezelés jellege</h3>
        <ul>
          <li>Online szerződéskezelő SaaS platform</li>
          <li>Elektronikus aláírás gyűjtése és tárolása</li>
          <li>AI-alapú szerződéselemzés (Anthropic Claude API)</li>
          <li>Automatizált audit naplózás</li>
        </ul>

        <h3>2.2 Az adatkezelés hatóköre</h3>
        <ul>
          <li>Regisztrált felhasználók személyes adatai (név, email, cégnév, adószám)</li>
          <li>Szerződések tartalma és metaadatai</li>
          <li>Aláírók adatai (név, email, IP-cím, böngészőadat, aláíráskép)</li>
          <li>AI elemzéshez továbbított szerződésszövegek</li>
        </ul>

        <h3>2.3 Az adatkezelés kontextusa</h3>
        <ul>
          <li>Magyar KKV-k számára fejlesztett platform</li>
          <li>B2B szolgáltatás, üzleti szerződések kezelése</li>
          <li>EU-n belüli tárhely (Hetzner GmbH, Németország)</li>
        </ul>

        <h2>3. Szükségesség és arányosság értékelése</h2>

        <h3>3.1 Jogalap</h3>
        <ul>
          <li><strong>Szerződés teljesítése</strong> (GDPR 6. cikk (1) b) — regisztrált felhasználók</li>
          <li><strong>Jogos érdek</strong> (GDPR 6. cikk (1) f) — biztonsági naplózás</li>
          <li><strong>Hozzájárulás</strong> (GDPR 6. cikk (1) a) — AI elemzés, cookie-k</li>
          <li><strong>Jogi kötelezettség</strong> (GDPR 6. cikk (1) c) — számviteli megőrzés (Szt.)</li>
        </ul>

        <h3>3.2 Adatminimalizálás</h3>
        <ul>
          <li>Csak a szolgáltatáshoz szükséges adatok gyűjtése</li>
          <li>Opcionális mezők: cégnév, adószám, telefonszám</li>
          <li>Audit logok anonimizálása 2 év után</li>
          <li>AI elemzés: szerződésszöveg nem tárolódik az Anthropic szerverein</li>
        </ul>

        <h3>3.3 Megőrzési idő</h3>
        <ul>
          <li><strong>Felhasználói adatok:</strong> fiók törléséig</li>
          <li><strong>Audit logok:</strong> 2 év (utána anonimizálás)</li>
          <li><strong>Számviteli adatok:</strong> 8 év (Szt. 169. § (2))</li>
          <li><strong>Cookie hozzájárulás:</strong> 1 év</li>
        </ul>

        <h2>4. Kockázatértékelés</h2>

        <h3>4.1 Azonosított kockázatok</h3>

        <h4>A) Adatszivárgás / jogosulatlan hozzáférés</h4>
        <ul>
          <li><strong>Valószínűség:</strong> Alacsony</li>
          <li><strong>Hatás:</strong> Magas</li>
          <li><strong>Kockázati szint:</strong> KÖZEPES</li>
          <li><strong>Intézkedések:</strong> HTTPS/TLS 1.3, bcrypt-12 jelszó hash, httpOnly JWT cookie, 2FA támogatás, CORS korlátozás</li>
        </ul>

        <h4>B) AI adattovábbítás (Anthropic, USA)</h4>
        <ul>
          <li><strong>Valószínűség:</strong> Közepes</li>
          <li><strong>Hatás:</strong> Közepes</li>
          <li><strong>Kockázati szint:</strong> KÖZEPES</li>
          <li><strong>Intézkedések:</strong> Standard Contractual Clauses (SCC), adatok nem tárolódnak az AI rendszerben, felhasználói hozzájárulás szükséges az elemzéshez</li>
        </ul>

        <h4>C) Aláírói adatok jogosulatlan felhasználása</h4>
        <ul>
          <li><strong>Valószínűség:</strong> Alacsony</li>
          <li><strong>Hatás:</strong> Közepes</li>
          <li><strong>Kockázati szint:</strong> ALACSONY</li>
          <li><strong>Intézkedések:</strong> Token-alapú hozzáférés, aláírói consent checkbox, IP/böngésző naplózás, aláírás kép titkosított tárolás (R2)</li>
        </ul>

        <h4>D) Audit logok személyes adatai</h4>
        <ul>
          <li><strong>Valószínűség:</strong> Alacsony</li>
          <li><strong>Hatás:</strong> Alacsony</li>
          <li><strong>Kockázati szint:</strong> ALACSONY</li>
          <li><strong>Intézkedések:</strong> 2 éves anonimizálás, hozzáférés-korlátozás, event data hash-elés</li>
        </ul>

        <h4>E) Harmadik fél adatfeldolgozók (Stripe, Resend, Cloudflare)</h4>
        <ul>
          <li><strong>Valószínűség:</strong> Alacsony</li>
          <li><strong>Hatás:</strong> Közepes</li>
          <li><strong>Kockázati szint:</strong> ALACSONY</li>
          <li><strong>Intézkedések:</strong> DPA minden feldolgozóval, SCC az USA-ba irányuló továbbításokhoz, PCI DSS tanúsítvány (Stripe)</li>
        </ul>

        <h2>5. Kockázatcsökkentő intézkedések összefoglalása</h2>

        <h3>5.1 Technikai intézkedések</h3>
        <ul>
          <li>HTTPS/TLS 1.3 titkosítás</li>
          <li>bcrypt-12 jelszó hash</li>
          <li>SHA-256 dokumentum integritás</li>
          <li>httpOnly, secure, sameSite cookie-k</li>
          <li>CORS korlátozás a frontend URL-re</li>
          <li>Kétfaktoros hitelesítés (TOTP)</li>
          <li>API kulcs hash-elés</li>
          <li>Automatikus session lejárat (30 nap)</li>
        </ul>

        <h3>5.2 Szervezeti intézkedések</h3>
        <ul>
          <li>Adatkezelési tájékoztató és ÁSZF</li>
          <li>Cookie consent mechanizmus</li>
          <li>Hozzájárulás verziókezelés és re-consent flow</li>
          <li>Fiók törlés (right to erasure) implementálva</li>
          <li>Adat export (data portability) implementálva</li>
          <li>Aláírói adatkezelési tájékoztató</li>
          <li>Email leiratkozási lehetőség</li>
          <li>Audit log anonimizálás</li>
        </ul>

        <h3>5.3 Szerződéses intézkedések</h3>
        <ul>
          <li>DPA (Adatfeldolgozási Megállapodás) minden harmadik féllel</li>
          <li>Standard Contractual Clauses (SCC) USA adattovábbításokhoz</li>
          <li>Transfer Impact Assessment (TIA) az Anthropic továbbításhoz</li>
        </ul>

        <h2>6. Az érintettek jogai</h2>
        <p>A platform biztosítja az alábbi jogok gyakorlását:</p>
        <ul>
          <li><strong>Hozzáférés joga</strong> (GDPR 15. cikk) — Beállítások &gt; Biztonság &gt; Adat export</li>
          <li><strong>Helyesbítés joga</strong> (GDPR 16. cikk) — Profil szerkesztése</li>
          <li><strong>Törlés joga</strong> (GDPR 17. cikk) — Fiók törlése</li>
          <li><strong>Korlátozás joga</strong> (GDPR 18. cikk) — Email: hello@szerzodes.cegverzum.hu</li>
          <li><strong>Adathordozhatóság</strong> (GDPR 20. cikk) — JSON export</li>
          <li><strong>Tiltakozás joga</strong> (GDPR 21. cikk) — Email leiratkozás + kapcsolatfelvétel</li>
          <li><strong>Hozzájárulás visszavonása</strong> (GDPR 7. cikk) — Fiók törlése</li>
        </ul>

        <h2>7. Felügyeleti hatóság konzultáció</h2>
        <p>
          A DPIA eredménye alapján a maradék kockázatok elfogadható szintűek. Amennyiben a kockázati szint
          emelkedne (pl. nagymértékű profilalkotás, automatizált döntéshozatal bevezetése), a NAIH-hal
          előzetes konzultáció szükséges (GDPR 36. cikk).
        </p>
        <p><strong>Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)</strong></p>
        <ul>
          <li><strong>Cím:</strong> 1055 Budapest, Falk Miksa utca 9-11.</li>
          <li><strong>Weboldal:</strong> <a href="https://naih.hu" target="_blank" rel="noopener noreferrer">https://naih.hu</a></li>
          <li><strong>Email:</strong> ugyfelszolgalat@naih.hu</li>
        </ul>

        <h2>8. Felülvizsgálat</h2>
        <p>
          A hatásvizsgálatot legalább évente, vagy az adatkezelési tevékenységek lényeges változása
          esetén felül kell vizsgálni.
        </p>
        <p><strong>Következő felülvizsgálat:</strong> 2027. március 7.</p>

        <hr />
        <p className="text-sm text-gray-400">
          Készítette: Szabó Leonárd Henrik | Dátum: 2026. március 7. | SzerződésPortál &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

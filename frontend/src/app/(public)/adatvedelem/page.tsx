import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatvédelmi Tájékoztató - SzerződésPortál",
  description: "A SzerződésPortál adatvédelmi tájékoztatója - GDPR megfelelőség",
};

export default function AdatvedelemPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Adatvédelmi Tájékoztató</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
        <h2>1. Adatkezelő</h2>
        <ul>
          <li><strong>Név:</strong> SzerződésPortál (Szabó Leonárd Henrik e.v.)</li>
          <li><strong>E-mail:</strong> hello@szerzodes.cegverzum.hu</li>
          <li><strong>Weboldal:</strong> https://szerzodes.cegverzum.hu</li>
        </ul>

        <h2>2. Az adatkezelés jogalapja</h2>
        <p>Az adatkezelés jogalapjai:</p>
        <ul>
          <li><strong>Szerződés teljesítése</strong> (GDPR 6. cikk (1) b) — a Szolgáltatás nyújtásához szükséges adatok</li>
          <li><strong>Jogos érdek</strong> (GDPR 6. cikk (1) f) — biztonsági naplózás, visszaélés-megelőzés</li>
          <li><strong>Hozzájárulás</strong> (GDPR 6. cikk (1) a) — marketing célú kommunikáció, cookie-k</li>
          <li><strong>Jogi kötelezettség</strong> (GDPR 6. cikk (1) c) — számviteli előírások</li>
        </ul>

        <h2>3. Kezelt személyes adatok köre</h2>
        <h3>3.1. Regisztráció és fiókkezelés</h3>
        <table>
          <thead>
            <tr><th>Adat</th><th>Cél</th><th>Megőrzési idő</th></tr>
          </thead>
          <tbody>
            <tr><td>Név</td><td>Azonosítás, szerződésekben</td><td>Fiók törléséig</td></tr>
            <tr><td>E-mail cím</td><td>Bejelentkezés, értesítések</td><td>Fiók törléséig</td></tr>
            <tr><td>Jelszó (hash)</td><td>Hitelesítés</td><td>Fiók törléséig</td></tr>
            <tr><td>Cégnév, adószám</td><td>Szerződésadatok, számlázás</td><td>Fiók törléséig + 8 év (Szt.)</td></tr>
            <tr><td>Telefonszám</td><td>Kapcsolattartás (opcionális)</td><td>Fiók törléséig</td></tr>
          </tbody>
        </table>

        <h3>3.2. Szerződéskezelés</h3>
        <table>
          <thead>
            <tr><th>Adat</th><th>Cél</th><th>Megőrzési idő</th></tr>
          </thead>
          <tbody>
            <tr><td>Szerződés tartalma</td><td>Szolgáltatás nyújtása</td><td>Fiók törléséig</td></tr>
            <tr><td>Aláírók neve, e-mail</td><td>Aláírási folyamat</td><td>Fiók törléséig</td></tr>
            <tr><td>Aláírási adat (rajz/gépelt)</td><td>E-aláírás rögzítése</td><td>Fiók törléséig</td></tr>
            <tr><td>IP cím, böngésző</td><td>Audit napló, biztonság</td><td>5 év</td></tr>
          </tbody>
        </table>

        <h3>3.3. Partnerkezelés</h3>
        <p>
          A rendszer az aláírási folyamat során automatikusan menti az aláírók adatait a felhasználó
          partneri nyilvántartásába. Ennek jogalapja a <strong>jogos érdek</strong> (GDPR 6. cikk (1) f) —
          az üzleti kapcsolatok nyilvántartása és a jövőbeli szerződéskötés megkönnyítése érdekében.
        </p>
        <table>
          <thead>
            <tr><th>Adat</th><th>Cél</th><th>Megőrzési idő</th></tr>
          </thead>
          <tbody>
            <tr><td>Partner neve, e-mail</td><td>Üzleti kapcsolattartás</td><td>Fiók törléséig</td></tr>
            <tr><td>Cég, telefon, adószám, cím</td><td>Szerződésadatok (opcionális)</td><td>Fiók törléséig</td></tr>
            <tr><td>Csoport/címke</td><td>Rendszerezés</td><td>Fiók törléséig</td></tr>
          </tbody>
        </table>
        <p>
          Az érintett partner bármikor kérheti adatai törlését a felhasználótól vagy közvetlenül
          a hello@szerzodes.cegverzum.hu címen.
        </p>

        <h3>3.4. Technikai adatok</h3>
        <ul>
          <li>IP cím és böngésző user agent — biztonsági naplózás</li>
          <li>Cookie-k — munkamenet kezelés, preferenciák</li>
          <li>Használati statisztikák — szolgáltatásfejlesztés (anonimizálva)</li>
        </ul>

        <h2>4. Adattovábbítás</h2>
        <p>Személyes adatokat az alábbi harmadik feleknek továbbíthatunk:</p>
        <ul>
          <li><strong>Cloudflare R2</strong> (EU régió) — dokumentumtárolás</li>
          <li><strong>Hetzner GmbH</strong> (Németország) — szerver infrastruktúra</li>
          <li><strong>Resend Inc.</strong> — email küldés (GDPR DPA aláírva)</li>
          <li><strong>Stripe Inc.</strong> — fizetéskezelés (PCI DSS tanúsított)</li>
          <li><strong>Anthropic</strong> — AI elemzés (a szerződés tartalmát csak az elemzés idejére továbbítjuk, nem tároljuk)</li>
          <li><strong>Webhook végpontok</strong> — a felhasználó által megadott harmadik fél URL-ekre továbbíthatunk
            aláírói adatokat (név, e-mail, aláírási státusz). A felhasználó felelős a fogadó fél
            GDPR-megfelelőségéért és adatfeldolgozási megállapodás meglétéért.</li>
        </ul>
        <p>
          Harmadik országba (EU-n kívülre) csak megfelelő garanciák mellett továbbítunk adatot
          (Standard Contractual Clauses vagy EU megfelelőségi határozat alapján).
        </p>

        <h2>5. Az érintett jogai</h2>
        <p>A GDPR alapján Önt az alábbi jogok illetik meg:</p>
        <ul>
          <li><strong>Hozzáférés joga</strong> — tájékoztatást kérhet a kezelt adatokról</li>
          <li><strong>Helyesbítés joga</strong> — pontatlan adatok javítását kérheti</li>
          <li><strong>Törlés joga</strong> — adatai törlését kérheti („elfeledtetéshez való jog")</li>
          <li><strong>Korlátozás joga</strong> — az adatkezelés korlátozását kérheti</li>
          <li><strong>Adathordozhatóság</strong> — adatait géppel olvasható formátumban kérheti</li>
          <li><strong>Tiltakozás joga</strong> — jogos érdek alapú adatkezelés ellen tiltakozhat</li>
          <li><strong>Hozzájárulás visszavonása</strong> — a hozzájáruláson alapuló adatkezelés bármikor visszavonható</li>
        </ul>
        <p>
          A <strong>törlés jogát</strong> és az <strong>adathordozhatóságot</strong> a Beállítások &gt; Biztonság
          menüpontban önkiszolgáló módon gyakorolhatja (fiók törlése, teljes adatexport letöltése).
          Egyéb jogai gyakorlásához írjon a <strong>hello@szerzodes.cegverzum.hu</strong> címre.
          Kérelmét 30 napon belül teljesítjük.
        </p>

        <h3>5.1. Hozzájárulás nyilvántartása</h3>
        <p>
          A regisztrációkor adott hozzájárulást (ÁSZF és Adatvédelmi tájékoztató elfogadása)
          a rendszer nyilvántartja, beleértve az elfogadás időpontját, a tájékoztató verzióját
          és az IP címet, a GDPR 7. cikk (1) bekezdésében foglalt igazolási kötelezettségnek megfelelően.
        </p>

        <h2>6. Cookie-k (sütik)</h2>
        <p>A weboldal az alábbi cookie-kat használja:</p>
        <ul>
          <li><strong>Szükséges cookie-k:</strong> Munkamenet-azonosító, JWT token — a Szolgáltatás működéséhez szükséges</li>
          <li><strong>Funkcionális cookie-k:</strong> Nyelvi beállítás, téma preferencia</li>
        </ul>
        <p>Jelenleg harmadik féltől származó analitikai vagy marketing cookie-kat nem használunk.</p>

        <h2>7. Adatbiztonság</h2>
        <p>Az adatok védelme érdekében az alábbi intézkedéseket alkalmazzuk:</p>
        <ul>
          <li>HTTPS (TLS 1.3) titkosított adatátvitel</li>
          <li>Jelszavak bcrypt hash-sel tárolva</li>
          <li>Dokumentumok SHA-256 integritásvédelemmel</li>
          <li>EU-ban található szerveren történő adattárolás</li>
          <li>Hozzáférés-korlátozás és audit napló</li>
          <li>Rendszeres biztonsági felülvizsgálat</li>
        </ul>

        <h2>8. Adatvédelmi incidens</h2>
        <p>
          Adatvédelmi incidens esetén a NAIH-ot (Nemzeti Adatvédelmi és Információszabadság Hatóság)
          72 órán belül értesítjük. Ha az incidens magas kockázattal jár, az érintetteket is
          haladéktalanul tájékoztatjuk.
        </p>

        <h2>9. Jogorvoslat</h2>
        <p>Ha úgy érzi, hogy adatkezelésünk jogellenes, panaszt tehet:</p>
        <ul>
          <li>
            <strong>NAIH</strong> (Nemzeti Adatvédelmi és Információszabadság Hatóság)<br />
            1055 Budapest, Falk Miksa utca 9-11.<br />
            www.naih.hu | ugyfelszolgalat@naih.hu
          </li>
          <li>Bírósághoz fordulhat a lakóhelye vagy tartózkodási helye szerinti törvényszéknél</li>
        </ul>

        <h2>10. Módosítások</h2>
        <p>
          Jelen tájékoztatót szükség esetén módosítjuk. A módosításokról a weboldalon és
          emailben értesítjük felhasználóinkat.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | SzerződésPortál &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

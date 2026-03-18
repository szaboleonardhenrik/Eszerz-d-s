import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatvédelmi Tájékoztató - Legitas",
  description: "A Legitas adatvédelmi tájékoztatója - GDPR megfelelőség",
};

export default function AdatvedelemPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Adatvédelmi Tájékoztató</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
        <h2>1. Adatkezelő</h2>
        <ul>
          <li><strong>Név:</strong> T-DIGITAL Solutions Korlátolt Felelősségű Társaság (Legitas)</li>
          <li><strong>Székhely:</strong> 1117 Budapest, Nándorfejérvári út 32. 1. em. 4. ajtó</li>
          <li><strong>Cégjegyzékszám:</strong> 01-09-428831</li>
          <li><strong>Adószám:</strong> 32526620-2-43</li>
          <li><strong>Képviselő:</strong> Yilmaz Attila Zoltán ügyvezető</li>
          <li><strong>E-mail:</strong> info@legitas.hu</li>
          <li><strong>Telefon:</strong> +36 70 560 0637</li>
          <li><strong>Weboldal:</strong> https://legitas.hu</li>
        </ul>
        <p>
          <strong>Adatvédelmi tisztviselő (DPO):</strong> A Szolgáltató a GDPR 37. cikke alapján jelenleg nem
          köteles adatvédelmi tisztviselő kinevezésére, tekintettel arra, hogy az adatkezelés nem minősül
          nagymértékű rendszeres megfigyelésnek és nem érint különleges adatkategóriákat szisztematikusan.
          Az adatvédelmi kérdésekben az info@legitas.hu e-mail címen lehet felvenni a kapcsolatot.
        </p>

        <h2>2. Az adatkezelés jogalapja</h2>
        <p>Az adatkezelés jogalapjai:</p>
        <ul>
          <li><strong>Szerződés teljesítése</strong> (GDPR 6. cikk (1) b) — a Szolgáltatás nyújtásához szükséges adatok</li>
          <li><strong>Jogos érdek</strong> (GDPR 6. cikk (1) f) — biztonsági naplózás, visszaélés-megelőzés.
            A jogos érdeken alapuló adatkezelés esetén az Adatkezelő érdekmérlegelési tesztet (LIA) végzett,
            amelynek eredménye kérésre elérhető az info@legitas.hu címen.</li>
          <li><strong>Hozzájárulás</strong> (GDPR 6. cikk (1) a) — marketing célú kommunikáció, cookie-k</li>
          <li><strong>Jogi kötelezettség</strong> (GDPR 6. cikk (1) c) — számviteli előírások</li>
        </ul>

        <h2>3. Kezelt személyes adatok köre</h2>
        <p>
          A GDPR 13. cikk (1) e) pontja alapján tájékoztatjuk, hogy az alábbi adatok megadása <strong>kötelező</strong> a szolgáltatás igénybevételéhez: név, e-mail cím. Az alábbi adatok megadása <strong>opcionális</strong>: cégnév, adószám, telefonszám. A kötelező adatok megadásának elmaradása esetén a regisztráció nem lehetséges.
        </p>

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
            <tr><td>IP cím, böngésző</td><td>Audit napló, biztonság</td><td>2 év (utána anonimizálva)</td></tr>
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
          a info@legitas.hu címen.
        </p>

        <h3>3.4. Technikai adatok</h3>
        <ul>
          <li>IP cím és böngésző user agent — biztonsági naplózás</li>
          <li>Cookie-k — munkamenet kezelés, preferenciák</li>
          <li>Használati statisztikák — szolgáltatásfejlesztés (anonimizálva)</li>
        </ul>

        <h3>3.5. Közvetett módon gyűjtött adatok — aláírók (GDPR 14. cikk)</h3>
        <p>
          Amennyiben a Felhasználó (szerződés létrehozója) az aláírási folyamat során harmadik személy (aláíró) személyes adatait adja meg a Platformon (név, e-mail cím), ezen adatok nem közvetlenül az érintettől származnak. Az érintett aláírókat az aláírási meghívó e-mailben tájékoztatjuk az adatkezelés tényéről, céljáról, jogalapjáról, az adatkezelő személyéről és az érintetti jogokról a GDPR 14. cikke alapján. Az aláíró adatainak forrása a szerződést létrehozó Felhasználó. Az adatkezelés célja az elektronikus aláírási folyamat lebonyolítása, jogalapja a szerződés teljesítése (GDPR 6. cikk (1) b)).
        </p>

        <h2>4. Adattovábbítás</h2>
        <p>Személyes adatokat az alábbi harmadik feleknek továbbíthatunk:</p>
        <ul>
          <li><strong>Cloudflare R2</strong> (EU régió) — dokumentumtárolás</li>
          <li><strong>Hetzner GmbH</strong> (Németország) — szerver infrastruktúra</li>
          <li><strong>Resend Inc.</strong> — email küldés (GDPR DPA aláírva) — USA — EU-US Data Privacy Framework (DPF) és Standard Contractual Clauses (SCC)</li>
          <li><strong>Stripe Inc.</strong> — fizetéskezelés (PCI DSS tanúsított) — USA — EU-US Data Privacy Framework (DPF), PCI DSS tanúsított</li>
          <li><strong>Anthropic</strong> — AI elemzés (a szerződés tartalmát csak az elemzés idejére továbbítjuk, nem tároljuk) — USA — Standard Contractual Clauses (SCC, EU 2021/914), az adatok nem kerülnek tartós tárolásra</li>
          <li><strong>Google LLC</strong> — OAuth hitelesítés (Google-fiókkal bejelentkezés; kizárólag a név és e-mail cím kerül átadásra) — USA — EU-US Data Privacy Framework (DPF)</li>
          <li><strong>Sentry (Functional Software Inc.)</strong> — hibamonitorozás és teljesítményfigyelés (crash reporting); kizárólag technikai adatokat továbbítunk (hibaüzenetek, stack trace, böngésző/OS verzió, IP cím anonimizálva) — USA — EU-US Data Privacy Framework (DPF) és Standard Contractual Clauses (SCC)</li>
          <li><strong>Webhook végpontok</strong> — a felhasználó által megadott harmadik fél URL-ekre továbbíthatunk
            aláírói adatokat (név, e-mail, aláírási státusz). A felhasználó felelős a fogadó fél
            GDPR-megfelelőségéért és adatfeldolgozási megállapodás meglétéért.</li>
        </ul>
        <p>
          Az adatfeldolgozás részleteit az{" "}
          <a href="/dpa" className="text-[#198296] underline">Adatfeldolgozási Megállapodás (DPA)</a>{" "}
          tartalmazza, amely a GDPR 28. cikke alapján automatikusan érvényes a Szolgáltatás igénybevételével.
        </p>
        <p>
          Harmadik országba (EU-n kívülre) csak megfelelő garanciák mellett továbbítunk adatot
          (Standard Contractual Clauses vagy EU megfelelőségi határozat alapján).
        </p>
        <p>
          Amennyiben a Standard Contractual Clauses (SCC) vagy az EU-US Data Privacy Framework (DPF) érvényessége megszűnne vagy érvénytelenné válna, az adattovábbítás a GDPR 49. cikk (1) b) pontja alapján (a szerződés teljesítéséhez szükséges) vagy a GDPR 49. cikk (1) a) pontja alapján (az érintett kifejezett hozzájárulásával) folytatódhat.
        </p>

        <h2>5. Az érintett jogai</h2>
        <p>A GDPR alapján Önt az alábbi jogok illetik meg:</p>
        <ul>
          <li><strong>Hozzáférés joga</strong> — tájékoztatást kérhet a kezelt adatokról</li>
          <li><strong>Helyesbítés joga</strong> — pontatlan adatok javítását kérheti</li>
          <li><strong>Törlés joga</strong> — adatai törlését kérheti ({"\u201Eelfeledtet\u00E9shez val\u00F3 jog\u201D"})</li>
          <li><strong>Korlátozás joga</strong> — az adatkezelés korlátozását kérheti</li>
          <li><strong>Adathordozhatóság</strong> — adatait géppel olvasható formátumban kérheti</li>
          <li><strong>Tiltakozás joga</strong> — jogos érdek alapú adatkezelés ellen tiltakozhat</li>
          <li><strong>Hozzájárulás visszavonása</strong> — a hozzájáruláson alapuló adatkezelés bármikor visszavonható.
            A hozzájárulás visszavonása ugyanolyan egyszerű, mint annak megadása: a marketing célú hozzájárulás
            a Beállítások &gt; Értesítések menüpontban, a cookie hozzájárulás a böngésző sütibeállításaiban,
            az AI elemzési hozzájárulás az elemzés indítása előtti megerősítő ablakban vonható vissza.</li>
          <li><strong>Közvetlen üzletszerzési célú adatkezelés elleni tiltakozás:</strong> A Felhasználó bármikor
            jogosult tiltakozni személyes adatainak közvetlen üzletszerzés céljából történő kezelése ellen
            (GDPR 21. cikk (2) bekezdés). Tiltakozás esetén az adatok e célból való kezelése haladéktalanul
            megszüntetésre kerül. A leiratkozás a Beállítások &gt; Értesítések menüpontban vagy az e-mailekben
            található leiratkozási link útján lehetséges.</li>
        </ul>
        <p>
          A <strong>törlés jogát</strong> és az <strong>adathordozhatóságot</strong> a Beállítások &gt; Biztonság
          menüpontban önkiszolgáló módon gyakorolhatja (fiók törlése, teljes adatexport letöltése).
          Egyéb jogai gyakorlásához írjon a <strong>info@legitas.hu</strong> címre.
          Kérelmét legkésőbb egy hónapon belül teljesítjük (GDPR 12. cikk (3) bekezdés). Szükség esetén — a kérelem összetettségére vagy a kérelmek számára tekintettel — ez a határidő további két hónappal meghosszabbítható, amelyről a kérelem kézhezvételétől számított egy hónapon belül, a késedelem okainak megjelölésével tájékoztatjuk.
        </p>
        <p>
          A GDPR 12. cikk (5) bekezdése alapján, amennyiben az érintett kérelme nyilvánvalóan megalapozatlan vagy — különösen ismétlődő jellege miatt — túlzó, az Adatkezelő ésszerű összegű díjat számíthat fel, vagy megtagadhatja a kérelem alapján történő intézkedést.
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

        <h3>6.1. Automatizált döntéshozatal és profilalkotás</h3>
        <p>
          A Platform AI elemzési funkciója kizárólag segédeszközként működik, és nem hoz az érintettre nézve
          joghatással bíró vagy hasonlóan jelentős mértékben érintő automatizált döntést a GDPR 22. cikke
          értelmében. Az AI elemzés eredménye tájékoztató jellegű, a végső döntést minden esetben az ember
          (a Felhasználó) hozza meg.
        </p>

        <h3>6.2. Korhatár</h3>
        <p>
          A Platform szolgáltatásait kizárólag 16. életévüket betöltött személyek vehetik igénybe.
          16 éven aluliak személyes adatait tudatosan nem gyűjtjük. Amennyiben tudomásunkra jut,
          hogy 16 éven aluli személy adatait kezeljük, azokat haladéktalanul töröljük.
        </p>

        <h2>7. Adatmegőrzési politika — összefoglaló</h2>
        <table>
          <thead>
            <tr><th>Adattípus</th><th>Megőrzési idő</th><th>Jogalap</th></tr>
          </thead>
          <tbody>
            <tr><td>Felhasználói fiókadatok (név, e-mail, jelszó hash)</td><td>Fiók törléséig (30 napon belüli törlés)</td><td>Szerződés teljesítése</td></tr>
            <tr><td>Cégnév, adószám, számlázási adatok</td><td>Fiók törléséig + 8 év</td><td>Számviteli tv. (Szt. 169. §)</td></tr>
            <tr><td>Szerződések tartalma, aláírási adatok</td><td>Fiók törléséig (30 napon belüli törlés)</td><td>Szerződés teljesítése</td></tr>
            <tr><td>Audit napló (IP cím, böngésző, műveletek)</td><td>2 év (utána anonimizálva)</td><td>Jogos érdek</td></tr>
            <tr><td>Partneri adatok (kontaktok)</td><td>Fiók törléséig vagy érintett kéréséig</td><td>Jogos érdek</td></tr>
            <tr><td>AI elemzés eredménye</td><td>Nem tárolódik tartósan (kizárólag megjelenítés idejére)</td><td>Szerződés teljesítése</td></tr>
            <tr><td>Cookie-k (munkamenet)</td><td>Böngésző bezárásáig / 30 nap</td><td>Szükséges az üzemeltetéshez</td></tr>
          </tbody>
        </table>
        <p>
          A fiók törlését követően az összes személyes adat <strong>30 napon belül véglegesen</strong> eltávolításra
          kerül, kivéve azokat az adatokat, amelyek megőrzését jogszabály írja elő
          (pl. számviteli bizonylatok 8 évig).
        </p>

        <h2>8. Adatbiztonság</h2>
        <p>Az adatok védelme érdekében az alábbi intézkedéseket alkalmazzuk:</p>
        <ul>
          <li>HTTPS (TLS 1.3) titkosított adatátvitel</li>
          <li>Jelszavak bcrypt hash-sel tárolva</li>
          <li>Dokumentumok SHA-256 integritásvédelemmel</li>
          <li>EU-ban található szerveren történő adattárolás</li>
          <li>Hozzáférés-korlátozás és audit napló</li>
          <li>Rendszeres biztonsági felülvizsgálat</li>
        </ul>

        <h2>9. Adatvédelmi incidens</h2>
        <p>
          Adatvédelmi incidens esetén a NAIH-ot (Nemzeti Adatvédelmi és Információszabadság Hatóság)
          72 órán belül értesítjük. Ha az incidens magas kockázattal jár, az érintetteket is
          haladéktalanul tájékoztatjuk.
        </p>
        <p>
          Magas kockázatú adatvédelmi incidens esetén az érintetteket e-mailben és az alkalmazáson
          belüli értesítéssel tájékoztatjuk haladéktalanul, de legkésőbb 72 órán belül.
        </p>

        <h2>10. Jogorvoslat</h2>
        <p>Ha úgy érzi, hogy adatkezelésünk jogellenes, panaszt tehet:</p>
        <ul>
          <li>
            <strong>NAIH</strong> (Nemzeti Adatvédelmi és Információszabadság Hatóság)<br />
            1055 Budapest, Falk Miksa utca 9-11.<br />
            www.naih.hu | ugyfelszolgalat@naih.hu
          </li>
          <li>Bírósághoz fordulhat a lakóhelye vagy tartózkodási helye szerinti törvényszéknél</li>
        </ul>

        <h2>11. Módosítások</h2>
        <p>
          Jelen tájékoztatót szükség esetén módosítjuk. A módosításokról a weboldalon és
          emailben értesítjük felhasználóinkat.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

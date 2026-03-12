import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Adatfeldolgozási Megállapodás (DPA) - Legitas",
  description: "Adatfeldolgozási megállapodás sablon a Legitas felhasználói számára (GDPR 28. cikk)",
};

export default function DpaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
        Adatfeldolgozási Megállapodás (DPA)
      </h1>
      <p className="text-sm text-gray-400 mb-4">
        GDPR 28. cikk szerinti adatfeldolgozási megállapodás
      </p>
      <p className="text-sm text-gray-500 mb-10">
        Ez a megállapodás automatikusan érvénybe lép a Legitas szolgáltatás igénybevételével.
        Hatályos: 2026. március 1.
      </p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600">
        <h2>1. Felek</h2>
        <ul>
          <li>
            <strong>Adatkezelő:</strong> A Legitas regisztrált felhasználója
            (a továbbiakban: &quot;Adatkezelő&quot;), aki a Szolgáltatáson keresztül
            személyes adatokat kezel (pl. szerződéseket hoz létre, aláírókat jelöl ki).
          </li>
          <li>
            <strong>Adatfeldolgozó:</strong> T-DIGITAL Solutions Kft. (Legitas),
            e-mail: info@legitas.hu (a továbbiakban: &quot;Adatfeldolgozó&quot;).
          </li>
        </ul>

        <h2>2. A megállapodás tárgya</h2>
        <p>
          Az Adatfeldolgozó az Adatkezelő megbízásából és utasítása szerint személyes adatokat
          dolgoz fel a Legitas szolgáltatás (a továbbiakban: &quot;Szolgáltatás&quot;) keretében,
          a GDPR 28. cikk rendelkezéseinek megfelelően.
        </p>

        <h2>3. A feldolgozás részletei</h2>
        <table>
          <thead>
            <tr><th>Szempont</th><th>Leírás</th></tr>
          </thead>
          <tbody>
            <tr><td>Feldolgozás célja</td><td>Online szerződéskezelés, e-aláírás, dokumentumtárolás</td></tr>
            <tr><td>Feldolgozás jellege</td><td>Tárolás, megjelenítés, e-mail küldés, PDF generálás, audit naplózás</td></tr>
            <tr><td>Személyes adatok típusai</td><td>Név, e-mail cím, aláírási kép, IP cím, böngésző adatok, céges adatok, telefonszám</td></tr>
            <tr><td>Érintettek kategóriái</td><td>Az Adatkezelő szerződéses partnerei, aláírók, kontaktszemélyek</td></tr>
            <tr><td>Feldolgozás időtartama</td><td>Az Adatkezelő fiókjának fennállása alatt, törlési kérelemig</td></tr>
          </tbody>
        </table>

        <h2>4. Az Adatfeldolgozó kötelezettségei</h2>
        <ul>
          <li>A személyes adatokat kizárólag az Adatkezelő dokumentált utasítása szerint dolgozza fel.</li>
          <li>Biztosítja, hogy az adatfeldolgozásra feljogosított személyek titoktartási kötelezettséget
            vállaltak vagy jogszabályi titoktartási kötelezettség alatt állnak.</li>
          <li>A GDPR 32. cikk szerinti technikai és szervezési intézkedéseket tesz az adatbiztonság érdekében:
            <ul>
              <li>HTTPS (TLS 1.3) titkosítás</li>
              <li>Jelszavak bcrypt-12 hash-sel</li>
              <li>Dokumentumok SHA-256 integritásvédelem</li>
              <li>EU-beli szerveren történő tárolás (Hetzner, Németország)</li>
              <li>Hozzáférés-korlátozás és audit napló</li>
            </ul>
          </li>
          <li>Csak a GDPR-nak megfelelő további adatfeldolgozókat vesz igénybe (lásd 6. pont).</li>
          <li>Segíti az Adatkezelőt az érintetti jogok (hozzáférés, törlés, adathordozhatóság) teljesítésében.</li>
          <li>Az Adatkezelő fiókjának törlésekor 30 napon belül törli az összes kezelt személyes adatot,
            kivéve a jogszabály által előírt megőrzési kötelezettségeket.</li>
          <li>Az Adatkezelő rendelkezésére bocsátja a megfelelőség igazolásához szükséges információkat.</li>
        </ul>

        <h2>5. Adatvédelmi incidens kezelése</h2>
        <p>
          Az Adatfeldolgozó az adatvédelmi incidensről való tudomásszerzést követően indokolatlan
          késedelem nélkül, de legkésőbb <strong>48 órán belül</strong> értesíti az Adatkezelőt.
          Az értesítés tartalmazza:
        </p>
        <ul>
          <li>Az incidens jellegét és az érintett adatok körét</li>
          <li>Az érintettek hozzávetőleges számát</li>
          <li>Az incidens valószínű következményeit</li>
          <li>A megtett és javasolt intézkedéseket</li>
        </ul>

        <h2>6. Al-adatfeldolgozók</h2>
        <p>Az Adatfeldolgozó az alábbi al-adatfeldolgozókat veszi igénybe:</p>
        <table>
          <thead>
            <tr><th>Név</th><th>Székhely</th><th>Tevékenység</th></tr>
          </thead>
          <tbody>
            <tr><td>Hetzner GmbH</td><td>Németország (EU)</td><td>Szerver infrastruktúra</td></tr>
            <tr><td>Cloudflare R2</td><td>EU régió</td><td>Dokumentumtárolás</td></tr>
            <tr><td>Resend Inc.</td><td>USA (SCC alapján)</td><td>E-mail küldés</td></tr>
            <tr><td>Stripe Inc.</td><td>USA (SCC alapján)</td><td>Fizetéskezelés</td></tr>
            <tr><td>Anthropic</td><td>USA (SCC alapján)</td><td>AI szerződéselemzés (ideiglenes)</td></tr>
            <tr><td>Google LLC</td><td>USA (EU megfelelőségi határozat)</td><td>OAuth hitelesítés (Google-fiókkal bejelentkezés)</td></tr>
          </tbody>
        </table>
        <p>
          Új al-adatfeldolgozó bevonása előtt az Adatfeldolgozó tájékoztatja az Adatkezelőt.
          Az Adatkezelő 14 napon belül tiltakozhat; tiltakozás esetén az Adatfeldolgozó nem
          vonja be az új al-adatfeldolgozót, vagy az Adatkezelő felmondhatja a Szolgáltatást.
        </p>

        <h2>7. Nemzetközi adattovábbítás</h2>
        <p>
          Az EU-n kívüli adattovábbítás (Resend, Stripe, Anthropic) a GDPR 46. cikk (2) c)
          bekezdése szerinti Standard Contractual Clauses (SCC) alapján történik.
          Az Adatfeldolgozó biztosítja, hogy minden al-adatfeldolgozó megfelelő garanciákat nyújt.
        </p>

        <h2>8. Audit jog</h2>
        <p>
          Az Adatkezelő jogosult — indokolt esetben, előzetes egyeztetés alapján — ellenőrizni,
          hogy az Adatfeldolgozó betartja-e jelen megállapodás rendelkezéseit. Az Adatfeldolgozó
          biztosítja az ellenőrzéshez szükséges hozzáférést.
        </p>

        <h2>9. Időtartam és megszüntetés</h2>
        <p>
          Jelen megállapodás a Szolgáltatás igénybevételével lép hatályba és a fiók törléséig
          (vagy a Szolgáltatás megszűnéséig) érvényes. A feldolgozás megszűnése után az
          Adatfeldolgozó — az Adatkezelő választása szerint — törli vagy visszajuttatja
          az összes személyes adatot.
        </p>

        <h2>10. Alkalmazandó jog</h2>
        <p>
          Jelen megállapodásra a magyar jog, különösen a GDPR (EU 2016/679 rendelet) és az
          információs önrendelkezési jogról szóló 2011. évi CXII. törvény (Info tv.) rendelkezései
          az irányadóak. Jogvita esetén a felek a Budapest II. és III. Kerületi Bíróság kizárólagos
          illetékességét kötik ki.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

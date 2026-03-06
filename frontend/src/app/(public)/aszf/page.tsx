import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ÁSZF - SzerződésPortál",
  description: "A SzerződésPortál Általános Szerződési Feltételei",
};

export default function AszfPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Általános Szerződési Feltételek</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark">
        <h2>1. Szolgáltató adatai</h2>
        <ul>
          <li><strong>Szolgáltató neve:</strong> SzerződésPortál (Szabó Leonárd Henrik e.v.)</li>
          <li><strong>Székhely:</strong> Magyarország</li>
          <li><strong>E-mail:</strong> hello@szerzodes.cegverzum.hu</li>
          <li><strong>Weboldal:</strong> https://szerzodes.cegverzum.hu</li>
        </ul>

        <h2>2. A szolgáltatás leírása</h2>
        <p>
          A SzerződésPortál (továbbiakban: Szolgáltatás) egy webalapú (SaaS) szerződéskezelő platform,
          amely lehetővé teszi a felhasználók számára, hogy online szerződéseket hozzanak létre előre
          elkészített sablonokból, azokat kitöltsék, elektronikusan aláírják és kezeljék.
        </p>
        <p>A Szolgáltatás főbb funkciói:</p>
        <ul>
          <li>Szerződéssablonok használata és testreszabása</li>
          <li>Elektronikus aláírás (egyszerű és fokozott)</li>
          <li>PDF generálás és letöltés</li>
          <li>Csapatkezelés és jogosultsági szintek</li>
          <li>Emlékeztetők és értesítések</li>
          <li>AI-alapú szerződéselemzés</li>
        </ul>

        <h2>3. Regisztráció és felhasználói fiók</h2>
        <p>
          A Szolgáltatás használatához regisztráció szükséges. A Felhasználó köteles valós adatokat megadni
          a regisztráció során. A felhasználói fiók személyre szól, annak hozzáférési adatait harmadik
          személy részére átadni tilos.
        </p>
        <p>
          A Szolgáltató fenntartja a jogot, hogy a hamis adatokkal létrehozott fiókokat előzetes
          értesítés nélkül megszüntesse.
        </p>

        <h2>4. Előfizetési csomagok és díjak</h2>
        <p>A Szolgáltatás az alábbi csomagokban érhető el:</p>
        <ul>
          <li><strong>Ingyenes:</strong> Havi 5 szerződés, 1 felhasználó, alap sablonok</li>
          <li><strong>Kezdő (2 990 Ft/hó):</strong> Havi 30 szerződés, 3 felhasználó, egyéni sablonok</li>
          <li><strong>Profi (9 990 Ft/hó):</strong> Korlátlan szerződés, 10 felhasználó, AI elemzés, analytics</li>
          <li><strong>Nagyvállalati:</strong> Egyedi árazás, korlátlan felhasználó, SLA garancia</li>
        </ul>
        <p>
          Az árak bruttó árak, magyar ÁFA-t tartalmaznak. Az éves előfizetés esetén 2 hónap kedvezményt biztosítunk.
          A díjfizetés bankkártyával vagy átutalással történik.
        </p>

        <h2>5. Az elektronikus aláírás érvényessége</h2>
        <p>
          A SzerződésPortálon létrehozott egyszerű elektronikus aláírás az eIDAS rendelet (EU 910/2014)
          és a Polgári Törvénykönyv (2013. évi V. törvény) alapján jogilag érvényes a legtöbb
          szerződéstípusnál.
        </p>
        <p>
          A platform <strong>nem helyettesíti a jogi tanácsadást</strong>. Bonyolultabb ügyleteknél
          javasoljuk ügyvéd bevonását. A Szolgáltató nem vállal felelősséget a sablonok konkrét
          jogi helyzetben való alkalmazhatóságáért.
        </p>

        <h2>6. Adatkezelés és biztonság</h2>
        <p>
          A Szolgáltató a felhasználók személyes adatait a GDPR (EU 2016/679) és az Info tv.
          (2011. évi CXII. törvény) rendelkezéseinek megfelelően kezeli. Részletes tájékoztatás
          az Adatvédelmi Tájékoztatóban található.
        </p>
        <p>
          A dokumentumok SHA-256 hash-sel védettek. A tárolás EU-s szerveren, titkosított
          kapcsolaton keresztül történik. Minden művelet audit naplóban rögzítésre kerül.
        </p>

        <h2>7. Szellemi tulajdon</h2>
        <p>
          A Szolgáltatás, annak forráskódja, design-ja és tartalma a Szolgáltató szellemi
          tulajdonát képezi. A Felhasználó által létrehozott szerződések tartalma a Felhasználó
          tulajdonában marad.
        </p>

        <h2>8. Felelősségkorlátozás</h2>
        <p>
          A Szolgáltató a Szolgáltatást „ahogy van" (as is) alapon nyújtja. Nem vállal felelősséget:
        </p>
        <ul>
          <li>A sablonok konkrét jogi helyzetben való alkalmazhatóságáért</li>
          <li>Az aláírás jogi érvényességének megítéléséért adott jogviszonyban</li>
          <li>Szolgáltatáskiesésből eredő károkért (vis major, karbantartás)</li>
          <li>A Felhasználó által megadott adatok helyességéért</li>
        </ul>

        <h2>9. Felmondás és adattörlés</h2>
        <p>
          A Felhasználó fiókját bármikor törölheti a Beállítások menüben. A törlés esetén
          az adatok 30 napon belül véglegesen eltávolításra kerülnek. Az aktív előfizetés
          felmondása a futamidő végén lép hatályba.
        </p>

        <h2>10. Módosítások</h2>
        <p>
          A Szolgáltató fenntartja az ÁSZF módosításának jogát. A módosításról a Felhasználókat
          emailben értesítjük legalább 15 nappal a hatálybalépés előtt. A Szolgáltatás további
          használata a módosított feltételek elfogadásának minősül.
        </p>

        <h2>11. Irányadó jog és jogviták</h2>
        <p>
          Jelen ÁSZF-re a magyar jog az irányadó. A felek vitáikat elsősorban békés úton
          rendezik. Ennek sikertelensége esetén a Budapesti II. és III. Kerületi Bíróság,
          illetve a Fővárosi Törvényszék kizárólagos illetékességét kötik ki.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | SzerződésPortál &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

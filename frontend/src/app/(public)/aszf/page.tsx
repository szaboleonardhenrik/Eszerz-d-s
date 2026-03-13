import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ÁSZF - Legitas",
  description: "A Legitas Általános Szerződési Feltételei",
};

export default function AszfPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Általános Szerződési Feltételek</h1>
      <p className="text-sm text-gray-400 mb-10">Hatályos: 2026. március 1.</p>

      <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark">
        <h2>1. Szolgáltató adatai</h2>
        <ul>
          <li><strong>Szolgáltató neve:</strong> T-DIGITAL Solutions Korlátolt Felelősségű Társaság (Legitas)</li>
          <li><strong>Székhely:</strong> 1117 Budapest, Nándorfejérvári út 32. 1. em. 4. ajtó</li>
          <li><strong>Cégjegyzékszám:</strong> 01-09-428831</li>
          <li><strong>Adószám:</strong> 32526620-2-43</li>
          <li><strong>Képviselő:</strong> Yilmaz Attila Zoltán ügyvezető</li>
          <li><strong>E-mail:</strong> info@legitas.hu</li>
          <li><strong>Telefon:</strong> +36 70 560 0637</li>
          <li><strong>Weboldal:</strong> https://legitas.hu</li>
          <li><strong>Tárhelyszolgáltató:</strong> Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Németország, www.hetzner.com</li>
        </ul>

        <h2>2. A szolgáltatás jellege – B2B/B2C</h2>
        <p>
          A Platform elsősorban vállalkozások (B2B) számára készült. Amennyiben a Felhasználó a Ptk. 8:1. § (1) bekezdés 3. pontja szerinti fogyasztónak minősül, a jelen ÁSZF rendelkezéseit a fogyasztóvédelemre vonatkozó jogszabályokkal összhangban kell értelmezni, és a fogyasztót megillető jogok nem korlátozhatók.
        </p>

        <h2>3. A szolgáltatás leírása</h2>
        <p>
          A Legitas (továbbiakban: Szolgáltatás) egy webalapú (SaaS) szerződéskezelő platform,
          amely lehetővé teszi a felhasználók számára, hogy online szerződéseket hozzanak létre előre
          elkészített sablonokból, azokat kitöltsék, elektronikusan aláírják és kezeljék.
        </p>
        <p>A Szolgáltatás főbb funkciói:</p>
        <ul>
          <li>Szerződéssablonok használata és testreszabása</li>
          <li>Egyszerű elektronikus aláírás (SES)</li>
          <li>PDF generálás és letöltés</li>
          <li>Csapatkezelés és jogosultsági szintek</li>
          <li>Emlékeztetők és értesítések</li>
          <li>AI-alapú szerződéselemzés</li>
        </ul>

        <p className="text-sm bg-amber-50 border border-amber-200 rounded-lg p-3 mt-2">
          <strong>Megjegyzés:</strong> A platform kizárólag egyszerű elektronikus aláírást (SES) támogat az eIDAS rendelet értelmében. Fokozott (AES) vagy minősített (QES) aláíráshoz tanúsítványkiadó szolgáltató szükséges.
        </p>

        <h2>4. Regisztráció és felhasználói fiók</h2>
        <p>
          A Szolgáltatás használatához regisztráció szükséges. A Felhasználó köteles valós adatokat megadni
          a regisztráció során. A felhasználói fiók személyre szól, annak hozzáférési adatait harmadik
          személy részére átadni tilos.
        </p>
        <p>
          A Szolgáltató fenntartja a jogot, hogy a hamis adatokkal létrehozott fiókokat előzetes
          értesítés nélkül megszüntesse.
        </p>

        <h2>4/A. Elektronikus szerződéskötés lépései</h2>
        <p>
          Az elektronikus kereskedelmi szolgáltatások, valamint az információs társadalommal összefüggő szolgáltatások egyes kérdéseiről szóló 2001. évi CVIII. törvény (Ekrtv.) 5–6. §-ai alapján az elektronikus szerződéskötés lépései a következők:
        </p>
        <ol>
          <li>A Felhasználó kiválasztja a kívánt előfizetési csomagot az Árazás (/pricing) oldalon.</li>
          <li>Megadja a regisztrációhoz és számlázáshoz szükséges adatait.</li>
          <li>Elfogadja az ÁSZF-et és az Adatvédelmi Tájékoztatót (jelölőnégyzet bejelölésével).</li>
          <li>A fizetés a Stripe fizetési rendszeren keresztül történik.</li>
          <li>A szerződés a sikeres fizetéssel jön létre.</li>
          <li>A sikeres fizetésről és a szerződés létrejöttéről a Felhasználó visszaigazoló e-mailt kap.</li>
        </ol>
        <p>
          Az adatbeviteli hibák a fizetés véglegesítése előtt bármikor javíthatók a regisztrációs és számlázási űrlapon. A szerződés nyelve magyar. A szerződést a Szolgáltató nem iktatja, de az a Felhasználó fiókjában (Beállítások &gt; Előfizetés) bármikor megtekinthető.
        </p>

        <h2>5. Előfizetési csomagok és díjak</h2>
        <p>A Szolgáltatás az alábbi csomagokban érhető el:</p>
        <ul>
          <li><strong>Kezdő (975 Ft + áfa/hó, bruttó 1 238 Ft):</strong> 2 szerződés/hó, 0 társfiók, 2 fő/szerződés, 24 időbélyeg/év, AI asszisztens, kézi e-aláírás</li>
          <li><strong>Közepes (14 950 Ft + áfa/hó, bruttó 18 987 Ft):</strong> 12 szerződés/hó, 2 társfiók, 10 fő/szerződés, 144 időbélyeg/év, sablontár, CRM, email követés</li>
          <li><strong>Prémium (26 000 Ft + áfa/hó, bruttó 33 020 Ft):</strong> 35 szerződés/hó, 5 társfiók, 10 fő/szerződés, 420 időbélyeg/év, API, branding, automatizáció</li>
          <li><strong>Nagyvállalati (149 500 Ft + áfa/hó, bruttó 189 865 Ft):</strong> 500 szerződés/hó, 20 társfiók, 10 fő/szerződés, 6 000 időbélyeg/év, VIP support, onboarding</li>
        </ul>
        <p>
          Az árak nettó árak, nem tartalmazzák a 27% ÁFÁ-t. Az éves előfizetés esetén ~23% kedvezményt biztosítunk.
          A díjfizetés bankkártyával (Stripe) vagy éves fizetés esetén banki átutalással történik.
        </p>

        <h2>6. Az elektronikus aláírás érvényessége</h2>
        <p>
          A Legitason létrehozott egyszerű elektronikus aláírás az eIDAS rendelet (EU 910/2014)
          és a Polgári Törvénykönyv (2013. évi V. törvény) alapján jogilag érvényes a legtöbb
          szerződéstípusnál.
        </p>
        <p>
          A platform <strong>nem helyettesíti a jogi tanácsadást</strong>. Bonyolultabb ügyleteknél
          javasoljuk ügyvéd bevonását. A Szolgáltató nem vállal felelősséget a sablonok konkrét
          jogi helyzetben való alkalmazhatóságáért.
        </p>

        <h2>7. Adatkezelés és biztonság</h2>
        <p>
          A Szolgáltató a felhasználók személyes adatait a GDPR (EU 2016/679) és az Info tv.
          (2011. évi CXII. törvény) rendelkezéseinek megfelelően kezeli. Részletes tájékoztatás
          az Adatvédelmi Tájékoztatóban található.
        </p>
        <p>
          A dokumentumok SHA-256 hash-sel védettek. A tárolás EU-s szerveren, titkosított
          kapcsolaton keresztül történik. Minden művelet audit naplóban rögzítésre kerül.
        </p>

        <h2>8. Szellemi tulajdon</h2>
        <p>
          A Szolgáltatás, annak forráskódja, design-ja és tartalma a Szolgáltató szellemi
          tulajdonát képezi. A Felhasználó által létrehozott szerződések tartalma a Felhasználó
          tulajdonában marad.
        </p>

        <h2>9. Felelősségkorlátozás</h2>
        <p>
          A Szolgáltató felelőssége nem haladhatja meg a Felhasználó által az előző 12 hónapban ténylegesen megfizetett szolgáltatási díjak összegét. A felelősségkorlátozás nem vonatkozik a szándékosan vagy súlyos gondatlansággal okozott károkra (Ptk. 6:152. §).
        </p>
        <p>
          A Szolgáltató nem vállal felelősséget:
        </p>
        <ul>
          <li>A sablonok konkrét jogi helyzetben való alkalmazhatóságáért</li>
          <li>Az aláírás jogi érvényességének megítéléséért adott jogviszonyban</li>
          <li>Szolgáltatáskiesésből eredő károkért (vis major, karbantartás)</li>
          <li>A Felhasználó által megadott adatok helyességéért</li>
          <li>Az AI-alapú szerződéselemzés pontosságáért vagy teljességéért</li>
        </ul>

        <h3>9.1. Elektronikus aláírás korlátozásai</h3>
        <p>
          A Legitas platformon elérhető elektronikus aláírás <strong>egyszerű elektronikus aláírásnak (SES)</strong> minősül
          az eIDAS rendelet (EU 910/2014) és a 2015. évi CCXXII. törvény értelmében. Ez <strong>nem azonos</strong> a
          minősített elektronikus aláírással (QES), amelyet tanúsított bizalmi szolgáltató (pl. Microsec, DÁP) bocsát ki.
        </p>
        <p>
          Az egyszerű elektronikus aláírás a Polgári Törvénykönyv (2013. évi V. törvény) 6:7. § (2) alapján a legtöbb
          szerződéstípusnál joghatás kiváltására alkalmas, azonban bizonyos jogügyleteknél jogszabály írhat elő
          <strong> írásbeli formát vagy minősített aláírást</strong>. Ilyenek különösen:
        </p>
        <ul>
          <li>Ingatlan adásvételi szerződések</li>
          <li>Hitel- és kölcsönszerződések</li>
          <li>Közjegyzői okiratot igénylő ügyletek</li>
          <li>Munkajogi dokumentumok egy része (pl. felmondás)</li>
        </ul>
        <p>
          A Szolgáltató <strong>nem garantálja</strong> az egyszerű elektronikus aláírás elfogadását bíróság
          vagy hatóság előtt. A Felhasználó felelőssége annak megítélése, hogy az adott jogügylethez
          milyen aláírási forma szükséges.
        </p>

        <h3>9.2. Sablonok és AI elemzés</h3>
        <p>
          A platformon elérhető szerződéssablonok <strong>általános tájékoztató jellegűek</strong>, és
          nem helyettesítik az egyedi ügyvédi tanácsadást. A Szolgáltató nem vállal felelősséget a sablonok
          jogi megfelelőségéért az adott felhasználási kontextusban.
        </p>
        <p>
          Az AI-alapú szerződéselemzés (Claude AI) <strong>kizárólag tájékoztató jellegű</strong>, és
          nem minősül jogi véleménynek, szaktanácsadásnak vagy ügyvédi állásfoglalásnak. A Szolgáltató
          nem vállal felelősséget az AI elemzés által adott javaslatokért, kockázatértékelésekért
          vagy hiányzó záradék-jelzésekért. Bonyolultabb ügyleteknél javasoljuk ügyvéd bevonását.
        </p>

        <h2>10. Rendelkezésre állás és karbantartás</h2>
        <p>
          A Szolgáltató a Szolgáltatást az év minden napján, 24 órában elérhetővé kívánja tenni,
          de nem garantálja a 100%-os rendelkezésre állást. A tervezett éves rendelkezésre állási
          cél <strong>99,5%</strong> (karbantartási időszakokat és vis major eseményeket nem számítva).
          Vis major alatt értendő különösen: természeti katasztrófák, háború, sztrájk, járvány, kibertámadás, közüzemi szolgáltatás kiesése, hatósági intézkedés, az internet működésének zavara. A vis major mentesítő hatása mindkét félre (Szolgáltatóra és Felhasználóra egyaránt) vonatkozik: egyik fél sem felel a vis major esemény miatt bekövetkezett szerződésszegésért, amennyiben az érintett fél bizonyítja, hogy a teljesítés az ellenőrzési körén kívül eső, elháríthatatlan ok miatt vált lehetetlenné.
        </p>
        <ul>
          <li><strong>Tervezett karbantartás:</strong> Előzetes értesítéssel (legalább 24 órával korábban, e-mailben),
            lehetőleg munkaidőn kívül (CET 22:00–06:00 között).</li>
          <li><strong>Nem tervezett karbantartás:</strong> Sürgős biztonsági javítás esetén, utólagos értesítéssel.</li>
          <li><strong>Adatvesztés elleni védelem:</strong> Napi automatikus mentés, EU-n belüli szerveren.</li>
        </ul>
        <p>
          A Szolgáltató nem vállal felelősséget a Szolgáltatás kiesésből eredő közvetett vagy
          következményi károkért.
        </p>

        <h2>11. Panaszkezelés</h2>
        <p>
          A Felhasználó a Szolgáltatással kapcsolatos panaszait az alábbi módon nyújthatja be:
        </p>
        <ul>
          <li><strong>E-mail:</strong> info@legitas.hu</li>
          <li><strong>Postai úton:</strong> T-DIGITAL Solutions Kft., 1117 Budapest, Nándorfejérvári út 32. 1. em. 4.</li>
          <li><strong>Telefonon:</strong> +36 70 560 0637</li>
        </ul>
        <p>
          Szóbeli (telefonos) panasz esetén a Szolgáltató a panaszt azonnal megvizsgálja, és lehetőség szerint orvosolja. Ha a Felhasználó a panasz kezelésével nem ért egyet, vagy a panasz azonnali kivizsgálása nem lehetséges, a Szolgáltató a panaszról jegyzőkönyvet vesz fel, és annak másolati példányát a Felhasználónak megküldi (a fogyasztóvédelemről szóló 1997. évi CLV. törvény 17/A. § alapján).
        </p>
        <p>
          Az írásbeli panaszt a Szolgáltató a beérkezéstől számított <strong>30 napon belül</strong> érdemben megvizsgálja
          és írásban (e-mailben) válaszol. Ha a panaszt a Szolgáltató elutasítja, a Felhasználó az alábbi
          szervekhez fordulhat:
        </p>
        <ul>
          <li><strong>Nemzeti Fogyasztóvédelmi Hatóság</strong> (fogyasztovedelem.kormany.hu)</li>
          <li>
            <strong>Budapesti Békéltető Testület</strong><br />
            Cím: 1016 Budapest, Krisztina krt. 99. III. em. 310.<br />
            Telefon: +36 1 488 2131<br />
            E-mail: bekelteto.testulet@bkik.hu<br />
            Web: <a href="https://bekeltet.bkik.hu">https://bekeltet.bkik.hu</a>
          </li>
          <li><strong>Online vitarendezési (ODR) platform:</strong>{" "}
            <a href="https://ec.europa.eu/consumers/odr">https://ec.europa.eu/consumers/odr</a>
          </li>
        </ul>

        <h2>12. Felmondás és adattörlés</h2>
        <p>
          A Felhasználó fiókját bármikor törölheti a Beállítások menüben. A Felhasználó a fiókja törlése előtt jogosult adatainak exportálására a Beállítások &gt; Biztonság menüpontban elérhető adatexport funkcióval, amely JSON formátumban is elérhető az adathordozhatósághoz való jog (GDPR 20. cikk) érvényesítése érdekében. A törlés esetén
          az adatok 30 napon belül véglegesen eltávolításra kerülnek. Az aktív előfizetés
          felmondása a futamidő végén lép hatályba.
        </p>

        <h2>13. Módosítások</h2>
        <p>
          A Szolgáltató fenntartja az ÁSZF módosításának jogát. A módosításról a Felhasználókat
          emailben értesítjük legalább 15 nappal a hatálybalépés előtt. A Szolgáltatás további
          használata a módosított feltételek elfogadásának minősül.
        </p>

        <h2>14. Elállási jog</h2>
        <p>
          A fogyasztót a 45/2014. (II. 26.) Korm. rendelet 20. §-a alapján 14 napos elállási jog illeti meg
          az előfizetés megkezdésétől számítva, indokolás nélkül.
        </p>
        <p>
          Digitális tartalom szolgáltatása esetén a fogyasztó kifejezett, előzetes hozzájárulásával a teljesítés
          a 14 napos elállási határidő lejárta előtt megkezdődhet. Ebben az esetben a fogyasztó tudomásul veszi,
          hogy a teljesítés megkezdését követően az elállási jogát elveszíti (45/2014. Korm. rendelet 29. § (1) m)).
        </p>
        <p>
          A Szolgáltató az elállásról való tudomásszerzéstől számított 14 napon belül visszatéríti a Felhasználó által teljesített valamennyi ellenszolgáltatást, beleértve a szolgáltatás nyújtásával összefüggésben felmerült költségeket is.
        </p>
        <p>
          Az elállási nyilatkozatot az info@legitas.hu email-címre kell megküldeni.
        </p>

        <h3>14.1. Elállási/Felmondási nyilatkozatminta</h3>
        <p className="text-sm bg-gray-50 border border-gray-200 rounded-lg p-4">
          <em>(A 45/2014. (II. 26.) Korm. rendelet 3. melléklete alapján. Csak a szerződéstől való elállási/felmondási szándék esetén töltse ki és juttassa vissza.)</em><br /><br />
          <strong>Címzett:</strong> T-DIGITAL Solutions Kft., 1117 Budapest, Nándorfejérvári út 32. 1. em. 4. ajtó, info@legitas.hu<br /><br />
          Alulírott/ak kijelenti/k, hogy gyakorlom/gyakoroljuk elállási/felmondási jogomat/jogunkat az alábbi szolgáltatás nyújtására irányuló szerződés tekintetében:<br />
          Szolgáltatás megnevezése: _______________<br />
          A szerződés megkötésének dátuma: _______________<br />
          A fogyasztó(k) neve: _______________<br />
          A fogyasztó(k) címe: _______________<br />
          A fogyasztó(k) aláírása (kizárólag papíron tett nyilatkozat esetén): _______________<br />
          Kelt: _______________
        </p>

        <h2>15. Irányadó jog és jogviták</h2>
        <p>
          Jelen ÁSZF-re a magyar jog az irányadó. Felek a jogvitáikat elsődlegesen egyeztetés útján rendezik. Fogyasztói jogviták esetén a fogyasztó lakóhelye vagy tartózkodási helye szerinti bíróság is illetékes. Vállalkozások közötti jogviták esetén a Budapesti II. és III. Kerületi Bíróság kizárólagos illetékességét kötik ki.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

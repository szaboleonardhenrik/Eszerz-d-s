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
        </ul>

        <h2>2. A szolgáltatás leírása</h2>
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
          <li><strong>Kezdő (975 Ft + áfa/hó):</strong> 2 szerződés/hó, 0 társfiók, 2 fő/szerződés, 24 időbélyeg/év, AI asszisztens, kézi e-aláírás</li>
          <li><strong>Közepes (14 950 Ft + áfa/hó):</strong> 12 szerződés/hó, 2 társfiók, 10 fő/szerződés, 144 időbélyeg/év, sablontár, CRM, email követés</li>
          <li><strong>Prémium (26 000 Ft + áfa/hó):</strong> 35 szerződés/hó, 5 társfiók, 10 fő/szerződés, 420 időbélyeg/év, API, branding, automatizáció</li>
          <li><strong>Nagyvállalati (149 500 Ft + áfa/hó):</strong> 500 szerződés/hó, 20 társfiók, 10 fő/szerződés, 6 000 időbélyeg/év, VIP support, onboarding</li>
        </ul>
        <p>
          Az árak nettó árak, nem tartalmazzák a 27% ÁFÁ-t. Az éves előfizetés esetén ~23% kedvezményt biztosítunk.
          A díjfizetés bankkártyával (Stripe) vagy éves fizetés esetén banki átutalással történik.
        </p>

        <h2>5. Az elektronikus aláírás érvényessége</h2>
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
          <li>Az AI-alapú szerződéselemzés pontosságáért vagy teljességéért</li>
        </ul>

        <h3>8.1. Elektronikus aláírás korlátozásai</h3>
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

        <h3>8.2. Sablonok és AI elemzés</h3>
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

        <h2>11. Elállási jog</h2>
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
          <strong>Minta elállási nyilatkozat:</strong><br />
          &ldquo;Alulírott [név] kijelentem, hogy elállási jogomat gyakorlom a Legitas [csomag neve]
          előfizetésére vonatkozó szerződés tekintetében. Kelt: [dátum]. Aláírás: [aláírás (csak papíron
          benyújtott nyilatkozat esetén)].&rdquo;<br />
          Az elállási nyilatkozatot a info@legitas.hu email-címre kell megküldeni.
        </p>

        <h2>12. Irányadó jog és jogviták</h2>
        <p>
          Jelen ÁSZF-re a magyar jog az irányadó. A felek vitáikat elsősorban békés úton
          rendezik. Ennek sikertelensége esetén a Budapesti II. és III. Kerületi Bíróság,
          illetve a Fővárosi Törvényszék kizárólagos illetékességét kötik ki.
        </p>

        <hr />
        <p className="text-sm text-gray-400">
          Utolsó módosítás: 2026. március 1. | Legitas &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

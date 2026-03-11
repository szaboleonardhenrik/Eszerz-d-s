"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { sanitizeHtml } from "@/lib/sanitize";

const articles: Record<string, { title: string; category: string; date: string; readTime: string; image: string; content: string }> = {
  "mesterseges-intelligencia-szerzodesek-jovo": {
    title: "Mesterséges intelligencia a szerződéskezelésben: így alakítja át az AI a jogi munkát",
    category: "Technológia",
    date: "2026. március 11.",
    readTime: "10 perc",
    image: "/images/blog/mesterseges-intelligencia-szerzodesek-jovo.jpg",
    content: `
      <h2>A jogi munka új korszaka</h2>
      <p>A mesterséges intelligencia az elmúlt két évben a technológiai szektorból kilépve szinte minden iparágat elért — és a jogi szektor sem kivétel. A McKinsey Global Institute 2025-ös felmérése szerint a jogi munkaidő mintegy 23%-a automatizálható generatív AI segítségével. Ez nem azt jelenti, hogy az ügyvédek feleslegessé válnak, hanem azt, hogy a rutin feladatoktól megszabadulva a valódi szakértelmet igénylő munkára koncentrálhatnak.</p>
      <p>A szerződéskezelés az egyik legígéretesebb terület az AI alkalmazására. Gondoljunk bele: egy átlagos magyar KKV évente több száz szerződést kezel — munkaszerződések, megbízási szerződések, NDA-k, bérleti megállapodások, ÁSZF-ek. Ezek átnézése, kockázatelemzése és összehasonlítása hatalmas idő- és energiaráfordítást igényel.</p>

      <h2>Mit tud az AI a szerződéseknél?</h2>
      <h3>1. Automatizált szerződéselemzés</h3>
      <p>A modern nyelvi modellek (LLM-ek) képesek egy szerződés teljes szövegét feldolgozni, és másodpercek alatt összefoglalót készíteni a legfontosabb pontokról: felek, futamidő, díjazás, felmondási feltételek, kockázatok. Ami egy jogásznak 30-60 perc, azt az AI 10 másodperc alatt elvégzi.</p>

      <h3>2. Kockázatfelismerés</h3>
      <p>Az AI kiemeli azokat a záradékokat, amelyek potenciális kockázatot jelentenek: egyoldalú felmondási jog, korlátlan kártérítési felelősség, homályos teljesítési feltételek, hiányzó szavatossági kikötések. A Ptk. 6:102. § szerinti tisztességtelen általános szerződési feltételeket is felismeri, és figyelmeztet rájuk.</p>

      <h3>3. Záradékjavaslatok és sablon-kiegészítés</h3>
      <p>Az AI nem csak elemez — javaslatokat is tesz. Ha egy szolgáltatási szerződésből hiányzik a vis maior záradék, az adatvédelmi kitétel vagy a szellemi tulajdon kezelésére vonatkozó pont, a rendszer automatikusan felajánlja a kiegészítést. Ez a Ptk. 6:63. § szerinti szerződéses szabadság keretein belül történik, tehát a felek szabadon dönthetnek az elfogadásról.</p>

      <h3>4. Összehasonlítás és verziókövetés</h3>
      <p>Amikor két fél egyeztet egy szerződésen, gyakran több verzió is születik. Az AI képes két verzió közötti különbségeket kimutatni, kiemelve a lényeges módosításokat — nem csupán szintaktikai, hanem tartalmi szinten is.</p>

      <h2>A számok nem hazudnak</h2>
      <p>A Deloitte 2025-ös Legal Technology Report szerint:</p>
      <ul>
        <li>Az AI-alapú szerződéselemzés <strong>átlagosan 65%-kal csökkenti</strong> a felülvizsgálati időt</li>
        <li>A hibaarány <strong>40%-kal alacsonyabb</strong> az AI-támogatott szerződéseknél</li>
        <li>A vállalatok <strong>évi 20-30%-ot spórolnak</strong> a jogi költségeiken</li>
        <li>Az aláírási ciklus <strong>50%-kal rövidül</strong></li>
      </ul>
      <p>Ezek nem futurisztikus ígéretek — ezek a 2025-ös valóság számai a nagyvállalati szektorban. A kérdés az, hogy a magyar KKV-k mikor lépnek be ebbe a körbe.</p>

      <h2>Félelmek és tévhitek</h2>
      <blockquote>„Az AI nem helyettesíti a jogászt — de a jogász, aki használja az AI-t, helyettesíti azt, aki nem."</blockquote>
      <p>A leggyakoribb félelem, hogy az AI „átveszi" a jogi munkát. Ez nem igaz. Az AI egy eszköz, amely a rutinfeladatokat végzi el, de a végső döntés mindig emberi kézben marad. Egy AI nem fog bíróság előtt érvelni, nem fog ügyféllel tárgyalni, és nem fog stratégiai döntést hozni. Amit viszont messze jobban csinál, mint bármelyik ember: nagy mennyiségű szöveget gyorsan és következetesen elemez.</p>

      <h2>Hogyan használja a Legitas az AI-t?</h2>
      <p>A Legitas platformba integrált Claude AI modell három fő funkcióban segíti a felhasználókat:</p>
      <ul>
        <li><strong>Szerződéselemzés:</strong> Töltsd fel a szerződést, és az AI percek alatt összefoglalót, kockázatelemzést és javaslatokat ad</li>
        <li><strong>Sablon-kiegészítés:</strong> A kitöltés során az AI figyelmeztet a hiányzó vagy pontatlan elemekre</li>
        <li><strong>Értelmezés:</strong> Kérdezd meg az AI-t bármelyik záradékról, és közérthető magyarázatot kapsz</li>
      </ul>
      <p>Ez nem helyettesíti a jogi tanácsadást, de sokkal magasabb szintre emeli a „első szűrőt" — és rengeteg időt és pénzt spórol a vállalkozásoknak.</p>

      <h2>Következtetés</h2>
      <p>A mesterséges intelligencia a szerződéskezelésben nem kérdés, hanem idő kérdése. Aki most lép, az versenyelőnyhöz jut. Aki vár, az lemarad. A Legitas ingyenes csomagjával kipróbálhatod az AI-alapú elemzést — regisztrálj, és győződj meg róla saját szemmel.</p>
    `,
  },
  "vallalkozas-inditasa-szukseges-szerzodesek": {
    title: "Vállalkozást indítasz? Ezek a szerződések kellenek az első naptól",
    category: "Útmutató",
    date: "2026. március 10.",
    readTime: "9 perc",
    image: "/images/blog/vallalkozas-inditasa-szukseges-szerzodesek.jpg",
    content: `
      <h2>Az alapítás jogi oldala</h2>
      <p>Magyarországon évente mintegy 50 000 új vállalkozás alakul. A legtöbb alapító a termékre, a piacra és a finanszírozásra koncentrál — miközben a jogi háttér gyakran háttérbe szorul. Pedig a hiányzó vagy rosszul megírt szerződések az első komoly probléma forrásai lehetnek. Ez a cikk összegyűjti azokat a dokumentumokat, amelyek nélkül nem érdemes elindulni.</p>

      <h2>1. Alapító okirat / társasági szerződés</h2>
      <p>Minden gazdasági társaságnak szüksége van alapító okiratra (egyszemélyes kft. esetén) vagy társasági szerződésre (több tag esetén). Ezt a Ptk. 3:4. § írja elő. A dokumentumnak tartalmaznia kell a cég nevét, székhelyét, tevékenységi köreit, a tagok adatait és vagyoni hozzájárulását, az ügyvezetés módját és a nyereségelosztás szabályait.</p>
      <p><strong>Fontos:</strong> Az alapító okiratot ügyvédnek kell ellenjegyeznie, és a cégbíróságon be kell jegyeztetni. Ez nem spórolható meg, de a többi szerződés elkészítése már a te kezedben van.</p>

      <h2>2. Tagi megállapodás (SHA)</h2>
      <p>Ha többen alapítjátok a céget, a társasági szerződés mellett érdemes egy részletes tagi megállapodást (Shareholders' Agreement) is kötni. Ez szabályozza a mindennapi döntéshozatalt, a kilépés és belépés feltételeit, a szellemi tulajdon kezelését, a vesting ütemezést (ha startup), és a vitarendezés módját.</p>
      <p>A tagi megállapodás nem kötelező, de a tapasztalat azt mutatja, hogy a társtulajdonosi viták a vállalkozások egyik leggyakoribb bukási oka. A Ptk. 3:90. § szerinti tagsági jogok és kötelezettségek jó kiindulópontot adnak, de a részleteket a megállapodásban kell szabályozni.</p>

      <h2>3. Munkaszerződések</h2>
      <p>Ha munkavállalókat alkalmazol, a Munka Törvénykönyve (Mt. 42-44. §) szerint írásbeli munkaszerződés kötése kötelező. Kötelező elemek: alapbér, munkakör, munkavégzés helye. De érdemes rögzíteni a próbaidőt, a titoktartási kötelezettséget és a versenytilalmi megállapodást is.</p>

      <h2>4. Megbízási / vállalkozási szerződések</h2>
      <p>Ha nem munkavállalót, hanem külsős szolgáltatót veszel igénybe (könyvelő, fejlesztő, designer, marketing ügynökség), megbízási vagy vállalkozási szerződésre van szükséged. A Ptk. 6:272. § (megbízás) és 6:238. § (vállalkozás) tartalmazza az alapvető szabályokat. Mindig rögzítsd a feladatot, a díjat, a határidőt és a szellemi tulajdon átruházását.</p>

      <h2>5. Titoktartási szerződés (NDA)</h2>
      <p>Már az első üzleti tárgyalás előtt szükséged lehet NDA-ra. Ha üzleti tervet, technológiát vagy ügyféladatbázist osztasz meg potenciális partnerekkel, befektetőkkel vagy alkalmazottakkal, a titoktartási megállapodás védi az érdekeidet. Egyoldalú és kétoldalú formában is készíthető.</p>

      <h2>6. Általános Szerződési Feltételek (ÁSZF)</h2>
      <p>Ha online szolgáltatást nyújtasz vagy webshopot üzemeltetsz, az ÁSZF nem opcionális — az elektronikus kereskedelemről szóló 2001. évi CVIII. törvény előírja. Az ÁSZF-nek tartalmaznia kell a szolgáltatás leírását, az árazást, a fizetési és szállítási feltételeket, az elállási jogot (fogyasztói szerződéseknél 14 nap) és a reklamációkezelés módját.</p>

      <h2>7. Adatvédelmi tájékoztató és DPA</h2>
      <p>A GDPR (EU 2016/679) szerint minden adatkezelőnek tájékoztatnia kell az érintetteket az adatkezelés módjáról. Ha külsős szolgáltatókkal dolgozol, akik hozzáférnek személyes adatokhoz (pl. felhőszolgáltató, e-mail marketing), adatfeldolgozói megállapodás (DPA) is szükséges a GDPR 28. cikke alapján.</p>

      <h2>A gyakorlati checklist</h2>
      <ul>
        <li>Alapító okirat / társasági szerződés (kötelező, ügyvédi ellenjegyzéssel)</li>
        <li>Tagi megállapodás (erősen ajánlott több alapító esetén)</li>
        <li>Munkaszerződések (kötelező, ha van alkalmazott)</li>
        <li>Megbízási / vállalkozási szerződések (külsős együttműködésekhez)</li>
        <li>NDA (üzleti tárgyalásokhoz, alkalmazottaknak)</li>
        <li>ÁSZF (online üzlethez kötelező)</li>
        <li>Adatvédelmi tájékoztató + DPA (GDPR-kötelezettség)</li>
      </ul>

      <h2>Hogyan segít a Legitas?</h2>
      <p>A Legitas platformon az összes fenti szerződéstípushoz találsz jogász által ellenőrzött, 2026-os jogszabályoknak megfelelő sablont. A wizard végigvezet a kitöltésen, az AI figyelmeztet a hiányzó elemekre, és az aláírás digitálisan, percek alatt lebonyolítható. Az ingyenes csomagban havi 5 szerződés kezelhető — pont elég egy induló vállalkozásnak.</p>
    `,
  },
  "freelancer-szerzodes-szabalyok-2026": {
    title: "Freelancer vagy megbízott? Így köss szabályos szerződést 2026-ban",
    category: "Munkajog",
    date: "2026. március 9.",
    readTime: "9 perc",
    image: "/images/blog/freelancer-szerzodes-szabalyok-2026.jpg",
    content: `
      <h2>A freelancer gazdaság növekedése</h2>
      <p>Magyarországon becslések szerint 300 000-400 000 ember dolgozik valamilyen formában szabadúszóként vagy megbízottként. A digitalizáció és a távmunka elterjedése tovább növeli ezt a számot. Mégis, a freelancer szerződések körül rengeteg a bizonytalanság: milyen típusú szerződést kell kötni, milyen adóvonzatai vannak, és mire kell figyelni, hogy a NAV ne minősítse át a jogviszonyt?</p>

      <h2>Megbízási vs. vállalkozási szerződés: mi a különbség?</h2>
      <h3>Megbízási szerződés (Ptk. 6:272. §)</h3>
      <p>A megbízási szerződésben a megbízott a megbízó érdekében <strong>gondossági kötelezettséggel</strong> jár el. Nem az eredmény a lényeg, hanem a tevékenység szakszerű elvégzése. Tipikus példák: jogi tanácsadás, könyvelés, coaching, oktatás, marketing tanácsadás.</p>

      <h3>Vállalkozási szerződés (Ptk. 6:238. §)</h3>
      <p>A vállalkozási szerződésben a vállalkozó egy <strong>konkrét eredmény</strong> létrehozására vállal kötelezettséget. A megrendelő a teljesítés elfogadása után fizet. Tipikus példák: weboldal fejlesztés, grafikai tervezés, szoftver készítés, fordítás, fotózás.</p>

      <blockquote>Ökölszabály: ha a megrendelő egy „végterméket" kap (weboldal, logó, szoftver, fordítás), az vállalkozási szerződés. Ha egy folyamatos tevékenységet (tanácsadás, oktatás, ügyintézés), az megbízás.</blockquote>

      <h2>Adójogi vonatkozások 2026-ban</h2>
      <p>A szerződés típusa meghatározza az adózást is. A legfontosabb szabályok:</p>
      <ul>
        <li><strong>Egyéni vállalkozó (KATA/átalány):</strong> A leggyakoribb freelancer forma. 2026-ban az átalányadózás 40%-os költséghányaddal működik a legtöbb szolgáltatásnál. Fontos: KATA csak egy megrendelő esetén nem alkalmazható (színlelt munkaviszony kockázata).</li>
        <li><strong>Megbízási díj kifizetés magánszemélynek:</strong> A kifizetőt terhelik a járulékok (TB: 13%, szociális hozzájárulás: 13%). A magánszemély SZJA-t fizet (15%). Ez a legdrágább forma.</li>
        <li><strong>Számla alapján:</strong> Ha a freelancer egyéni vállalkozó és számlát ad, a megrendelőnek semmilyen járulékot nem kell fizetnie — csak a számla összegét.</li>
      </ul>

      <h2>A NAV figyelő szemei: színlelt munkaviszony</h2>
      <p>A NAV kiemelt figyelmet fordít arra, hogy egy megbízási vagy vállalkozási szerződés mögött ne rejtőzzön valójában munkaviszony. Az Mt. 75/A. § alapján a munkaviszony fennállását vélelmezni kell, ha:</p>
      <ul>
        <li>A munkát végző személy kizárólag egy megrendelőnek dolgozik</li>
        <li>A megrendelő határozza meg a munkaidőt és a munkavégzés helyét</li>
        <li>A megrendelő eszközeivel dolgozik</li>
        <li>Utasítási jog érvényesül a munkavégzés módjára</li>
        <li>Havonta fix összegű díjazást kap</li>
      </ul>
      <p>Ha a NAV átminősíti a jogviszonyt, a megrendelőt terhelik a járulékok és a bírság — ez akár milliós tételeket is jelenthet.</p>

      <h2>Mit tartalmazzon egy jó freelancer szerződés?</h2>
      <ul>
        <li><strong>Felek pontos adatai</strong> (cégnév/név, székhely/lakcím, adószám)</li>
        <li><strong>A feladat pontos leírása</strong> — minél konkrétabb, annál jobb</li>
        <li><strong>Díjazás</strong> — összeg, fizetési ütemezés, számla típusa</li>
        <li><strong>Határidők</strong> — teljesítési határidő, mérföldkövek</li>
        <li><strong>Szellemi tulajdon</strong> — ki lesz a jogosultja a létrehozott műnek (Ptk. 6:247. §)</li>
        <li><strong>Titoktartás</strong> — bizalmas információk védelme</li>
        <li><strong>Felmondás</strong> — rendes és rendkívüli felmondás feltételei</li>
        <li><strong>Felelősség</strong> — hibás teljesítés, késedelem esetén</li>
      </ul>

      <h2>Gyakori hibák, amiket kerülj el</h2>
      <ul>
        <li>Szóbeli megállapodás alapján dolgozni — mindig kérj írásbeli szerződést</li>
        <li>A szellemi tulajdon kérdését nyitva hagyni — vitás esetben az alkotó marad a jogosult</li>
        <li>Fix havi díjat fizetni utasítási joggal — ez munkaviszonynak minősülhet</li>
        <li>Nem szabályozni a felmondást — ha nincs benne, a Ptk. diszpozitív szabályai érvényesülnek</li>
      </ul>

      <h2>A Legitas megoldása freelancereknek</h2>
      <p>A Legitas megbízási és vállalkozási szerződés sablonjai kifejezetten a freelancer piacra lettek optimalizálva. A kitöltő wizard végigvezet a fontos pontokon, és figyelmeztet, ha valami hiányzik. Ráadásul az AI elemzés azonnal jelzi, ha a szerződés egyes elemei munkaviszonyt sejtetnek — így még aláírás előtt korrigálhatsz.</p>
    `,
  },
  "berles-szerzodes-buktatoi-amikre-figyelj": {
    title: "Bérleti szerződés buktatói: 7 pont, amit soha ne hagyj ki",
    category: "Ingatlan",
    date: "2026. március 8.",
    readTime: "8 perc",
    image: "/images/blog/berles-szerzodes-buktatoi-amikre-figyelj.jpg",
    content: `
      <h2>Miért nem elég a „szokásos" bérleti szerződés?</h2>
      <p>Magyarországon évente több százezer bérleti szerződés születik, és a vitás ügyek jelentős része abból fakad, hogy a felek nem szabályozták részletesen a feltételeket. Az internetről letöltött „minta" szerződések gyakran hiányosak, elavultak vagy egyoldalúak. A Ptk. 6:331-6:340. §§ szabályozzák a bérleti jogviszony alapjait, de a részleteket a feleknek kell kidolgozniuk.</p>

      <h2>1. Kaució: mennyi, mire és hogyan?</h2>
      <p>A kaució (óvadék) a bérbeadó biztosítéka a bérlő esetleges károkozása vagy díjhátraléka ellen. A Ptk. 6:338. § szerint a kaució mértéke nem haladhatja meg a havi bérleti díj háromszorosát. De a szerződésben pontosan rögzíteni kell:</p>
      <ul>
        <li>A kaució pontos összegét és befizetésének módját</li>
        <li>Milyen esetben tarthatja meg a bérbeadó (kár, elmaradt díj, rendkívüli takarítás)</li>
        <li>A visszafizetés határidejét (általában 15-30 nap a kiköltözés után)</li>
        <li>Kamatozik-e (alapesetben nem, de megállapodhatnak benne)</li>
      </ul>
      <p><strong>Tipp:</strong> Készíts átadás-átvételi jegyzőkönyvet fotókkal — ez a legjobb bizonyíték vitás esetben.</p>

      <h2>2. Felmondás: kinek, mikor és hogyan?</h2>
      <p>A felmondási szabályokat kötelező részletesen szabályozni. A Ptk. szerint határozatlan idejű bérletnél a felmondási idő hónap végére szóló 15 nap. Határozott idejű bérletnél főszabály szerint a lejáratig nem mondható fel. A szerződésben érdemes rögzíteni:</p>
      <ul>
        <li>Rendes felmondás lehetőségét és felmondási idejét (30, 60 vagy 90 nap)</li>
        <li>Rendkívüli felmondási okokat (nemfizetés, szabályszegés, nem rendeltetésszerű használat)</li>
        <li>A felmondás formáját (mindig írásban, tértivevényes levéllel vagy e-mailben)</li>
      </ul>

      <h2>3. Karbantartás és javítások: ki fizeti?</h2>
      <p>Ez a leggyakoribb vitaforrás a bérbeadó és a bérlő között. A Ptk. 6:335. § szerint a bérbeadó köteles a bérleményt állagmegóvó javításokkal fenntartani, a bérlő pedig a kisebb karbantartásokat végzi. De mit jelent „kisebb"? Ezt pontosítani kell:</p>
      <ul>
        <li>Bérlő felelőssége: csaptelep csere, villanykapcsoló, kilincs, festés bizonyos összeghatárig</li>
        <li>Bérbeadó felelőssége: fűtésrendszer, csőtörés, tetőszigetelés, gépészeti rendszerek</li>
        <li>Összeghatár megállapítása (pl. 30 000 Ft alatt bérlő, felett bérbeadó)</li>
      </ul>

      <h2>4. Közüzemi díjak: átírás vagy átalány?</h2>
      <p>Soha ne hagyd nyitva a közüzemi díjak kérdését. Két megoldás létezik:</p>
      <ul>
        <li><strong>Átírás a bérlő nevére:</strong> A bérlő közvetlenül fizet a szolgáltatóknak. Ez a legtisztább megoldás — a bérbeadónak nincs kockázata.</li>
        <li><strong>Bérbeadó nevén marad:</strong> A bérlő a bérbeadónak fizet. Ilyenkor rögzíteni kell az elszámolás módját (átalány vagy mérőóra alapján) és a leolvasás gyakoriságát.</li>
      </ul>

      <h2>5. Albérlet és társbérlő: szabad-e?</h2>
      <p>A Ptk. 6:332. § szerint a bérlő a bérbeadó hozzájárulása nélkül nem adhatja albérletbe a lakást. De ezt a szerződésben is egyértelműen ki kell mondani, beleértve:</p>
      <ul>
        <li>Albérletbe adás tilalmát vagy feltételeit</li>
        <li>Airbnb-típusú rövid távú kiadás tilalmát (ha releváns)</li>
        <li>Társbérlő/együttlakó befogadásának szabályait</li>
      </ul>

      <h2>6. Leltár és állapotfelmérés</h2>
      <p>Bútorozott lakás esetén a leltár elengedhetetlen. A szerződés mellékletét képező leltárnak tartalmaznia kell:</p>
      <ul>
        <li>Minden bútor és berendezés felsorolását</li>
        <li>Azok állapotát (új, használt, kopott)</li>
        <li>Fotódokumentációt (dátummal ellátva)</li>
        <li>Mérőóra állásokat a beköltözéskor</li>
      </ul>
      <p>Kiköltözéskor ugyanezt a leltárt kell alapul venni az esetleges károk megállapításához.</p>

      <h2>7. Biztosítás: kinek kell kötnie?</h2>
      <p>A lakásbiztosítás kérdése gyakran elsikkad. Érdemes szabályozni:</p>
      <ul>
        <li>A bérbeadó köt-e épületbiztosítást (ajánlott)</li>
        <li>A bérlőtől elvárható-e háztartási biztosítás (a saját ingóságaira és a felelősségbiztosításra)</li>
        <li>Kár esetén az eljárás módját</li>
      </ul>

      <h2>A Legitas bérleti szerződés sablonja</h2>
      <p>A Legitas bérleti szerződés sablonja mind a 7 fenti pontot tartalmazza, jogász által ellenőrzött, 2026-os jogszabályoknak megfelelő formában. A wizard végigvezet a kitöltésen, a leltár mellékletként csatolható, és az AI elemzés kiemeli, ha valami fontos kimaradt. A digitális aláírással az egész folyamat percek alatt lebonyolítható — személyes találkozó nélkül is.</p>
    `,
  },
  "szerzodes-felmondasanak-szabalyai": {
    title: "Szerződés felmondása: mikor, hogyan és milyen következményekkel?",
    category: "Jogi útmutató",
    date: "2026. március 7.",
    readTime: "9 perc",
    image: "/images/blog/szerzodes-felmondasanak-szabalyai.jpg",
    content: `
      <h2>A szerződés megszüntetésének módjai</h2>
      <p>A Polgári Törvénykönyv (Ptk.) a szerződés megszüntetésének több módját ismeri. A leggyakoribbak: közös megegyezéssel történő megszüntetés, felmondás és elállás. Ebben a cikkben a felmondás szabályait vesszük részletesen górcső alá — mert ez az, amivel a legtöbb vállalkozás a gyakorlatban találkozik.</p>

      <h2>Rendes felmondás (Ptk. 6:213. §)</h2>
      <p>A rendes felmondás a tartós jogviszonyok (határozatlan idejű szerződések) megszüntetésének szokásos módja. Jellemzői:</p>
      <ul>
        <li><strong>Indokolás nem szükséges</strong> — a fél szabadon felmondhat</li>
        <li><strong>Felmondási idő:</strong> A szerződésben meghatározott idő, ennek hiányában a Ptk. diszpozitív szabályai irányadók (általában a hónap végére szóló, ésszerű időben)</li>
        <li><strong>Hatály:</strong> A felmondás a felmondási idő lejártával szünteti meg a jogviszonyt</li>
      </ul>
      <p>Fontos: határozott idejű szerződést főszabály szerint nem lehet rendes felmondással megszüntetni — csak ha a szerződés kifejezetten lehetővé teszi.</p>

      <h2>Rendkívüli felmondás (azonnali hatályú)</h2>
      <p>A rendkívüli (azonnali hatályú) felmondásra akkor van lehetőség, ha a másik fél súlyosan megszegi a szerződést. A Ptk. 6:213. § (3) bekezdése szerint a fél azonnali hatállyal felmondhatja a szerződést, ha a másik fél a szerződésszegést — megfelelő határidő tűzése és felszólítás ellenére — nem orvosolja.</p>
      <p>Rendkívüli felmondási okok lehetnek:</p>
      <ul>
        <li>Ismételt vagy tartós nemfizetés</li>
        <li>Lényeges szerződési feltétel súlyos megsértése</li>
        <li>Bizalomvesztés (pl. titoktartás megsértése)</li>
        <li>A szerződés céljának meghiúsulása</li>
      </ul>
      <blockquote>A rendkívüli felmondáshoz mindig kell indokolás. Indokolás nélküli azonnali felmondás jogellenes, és kártérítési kötelezettséget vonhat maga után.</blockquote>

      <h2>Formai követelmények</h2>
      <p>A felmondás formájára a Ptk. nem ír elő általános szabályt — de a gyakorlatban az alábbiak elengedhetetlenek:</p>
      <ul>
        <li><strong>Írásbeliség:</strong> Bár jogilag szóban is érvényes lehet, mindig írásbeli felmondást alkalmazz. Ez a bizonyíthatóság alapfeltétele.</li>
        <li><strong>Kézbesítés igazolása:</strong> Tértivevényes levél, vagy bizonyítható elektronikus kézbesítés (olvasási visszaigazolás, digitális aláírás).</li>
        <li><strong>Tartalom:</strong> A felmondásnak tartalmaznia kell a szerződés azonosítóját, a felmondás időpontját, és rendkívüli felmondás esetén az indokolást.</li>
      </ul>
      <p>Ha a szerződés előírja a felmondás módját (pl. „kizárólag tértivevényes levélben"), akkor azt kötelező betartani — ellenkező esetben a felmondás érvénytelen lehet.</p>

      <h2>Felmondási idő: mennyit kell várni?</h2>
      <p>A felmondási idő hossza szerződéstípusonként változik:</p>
      <ul>
        <li><strong>Bérleti szerződés:</strong> Határozatlan idejű bérlet esetén a hónap végére szóló 15 nap (Ptk. 6:339. §)</li>
        <li><strong>Munkaszerződés:</strong> Alapeset 30 nap, ami a munkaviszony időtartamával növekszik (Mt. 69. §), maximum 90 nap</li>
        <li><strong>Megbízási szerződés:</strong> A megbízó bármikor felmondhatja, de a megbízott kárát meg kell térítenie (Ptk. 6:278. §)</li>
        <li><strong>Szolgáltatási szerződés:</strong> A szerződésben rögzítettek szerint, általában 30-90 nap</li>
      </ul>

      <h2>Következmények: mi történik a felmondás után?</h2>
      <h3>Elszámolás</h3>
      <p>A felmondás időpontjáig teljesített szolgáltatásokért a díjazás jár. A már kifizetett, de nem teljesített szolgáltatások díja visszajár. Az elszámolás határidejét érdemes a szerződésben rögzíteni (általában 15-30 nap).</p>

      <h3>Titoktartás és versenytilalom</h3>
      <p>A titoktartási és versenytilalmi kötelezettségek jellemzően túlélik a szerződés megszűnését — a szerződésben meghatározott ideig (általában 1-3 év) továbbra is érvényesek. Erre a Ptk. 6:271. § ad alapot.</p>

      <h3>Kártérítés</h3>
      <p>Jogellenes felmondás esetén a sérelmet szenvedett fél kártérítést követelhet. A kártérítés mértéke a tényleges kár és az elmaradt haszon. A Ptk. 6:142-6:144. §§ tartalmazzák a kártérítés általános szabályait.</p>

      <h2>Gyakorlati sablon: mit írj a felmondólevélbe?</h2>
      <p>Egy szabályos felmondólevél tartalmazza:</p>
      <ul>
        <li>A felek adatait (név, cím, adószám)</li>
        <li>A felmondott szerződés megnevezését és dátumát</li>
        <li>A felmondás típusát (rendes / rendkívüli)</li>
        <li>A felmondási idő kezdő és záró napját</li>
        <li>Rendkívüli felmondás esetén az indokolást</li>
        <li>Az elszámolásra vonatkozó igényt</li>
        <li>Dátumot és aláírást</li>
      </ul>

      <h2>Hogyan segít a Legitas?</h2>
      <p>A Legitas platformon nem csak a szerződések megkötésében, hanem azok szabályos megszüntetésében is segítünk. A felmondási sablon automatikusan tartalmazza a kötelező elemeket, az AI elemzés ellenőrzi a felmondás jogszerűségét, és a digitális kézbesítés igazoltan történik — audit naplóval és időbélyeggel. Ha bizonytalan vagy, a platform AI tanácsadója közérthető nyelven elmagyarázza a lehetőségeidet.</p>
    `,
  },
  "elektronikus-alairas-magyarorszagon-2026": {
    title: "Elektronikus aláírás Magyarországon 2026-ban: amit tudnod kell",
    category: "Jogi útmutató",
    date: "2026. március 5.",
    readTime: "8 perc",
    image: "/images/blog/elektronikus-alairas-magyarorszagon-2026.jpg",
    content: `
      <h2>Mi az elektronikus aláírás?</h2>

      <p>Az elektronikus aláírás (e-aláírás) olyan elektronikus adat, amelyet más elektronikus adatokhoz csatolnak vagy logikailag hozzárendelnek, és amelyet az aláíró az aláírásra használ. Az Európai Unió eIDAS rendelete (EU 910/2014) három szintet különböztet meg.</p>

      <h2>Az eIDAS rendelet három szintje</h2>
      <h3>1. Egyszerű elektronikus aláírás (SES)</h3>
      <p>A legegyszerűbb forma: lehet egy beírt név, egy checkbox kipipálása, vagy egy rajzolt aláírás a képernyőn. Jogilag érvényes a legtöbb szerződéstípusnál — a Ptk. szerint a szerződés alaki kötöttség hiányában szóban is megköthető, tehát az egyszerű e-aláírás bőven elegendő.</p>

      <h3>2. Fokozott biztonságú elektronikus aláírás (AES)</h3>
      <p>Az AES kizárólag az aláíróhoz köthető, alkalmas az aláíró azonosítására, és az aláíró kizárólagos ellenőrzése alatt álló adatokkal hozzák létre. Bármely utólagos módosítás észlelhető. Ilyen például a digitális tanúsítvánnyal készült aláírás.</p>

      <h3>3. Minősített elektronikus aláírás (QES)</h3>
      <p>A legmagasabb szint. Minősített aláírás-létrehozó eszközzel és minősített tanúsítvány alapján készül. Magyarországon a Microsec és a NISZ (korábban Netlock) szolgáltatók adnak ki ilyen tanúsítványokat. A QES teljes bizonyító erejű magánokiratnak minősül.</p>

      <h2>Mikor melyik szint kell?</h2>
      <p>A magyar jog szerint a szerződések túlnyomó többségéhez elegendő az egyszerű elektronikus aláírás. Kivételek, ahol minősített aláírás vagy írásbeli forma szükséges:</p>
      <ul>
        <li>Ingatlan adásvételi szerződés (ügyvédi ellenjegyzés is kell)</li>
        <li>Végrendelet</li>
        <li>Házassági vagyonjogi szerződés</li>
        <li>Kezességi szerződés</li>
      </ul>

      <h2>A Legitas megoldása</h2>
      <p>A Legitas mindhárom szintet támogatja. Az ingyenes csomagban egyszerű e-aláírás érhető el (rajzolt és gépelt), míg a Profi csomagban fokozott és minősített aláírás is használható DÁP és Microsec integráción keresztül.</p>
      <p>Minden aláíráshoz audit napló készül: rögzítjük az IP-címet, a böngészőt, az időbélyeget és a dokumentum SHA-256 hash-ét. Ez bizonyítási szempontból fontos lehet egy esetleges jogvitában.</p>

      <h2>Összefoglalás</h2>
      <p>2026-ban az e-aláírás már nem jövőkép, hanem napi gyakorlat. A magyar jogszabályok és az eIDAS rendelet egyaránt támogatják a digitális szerződéskötést. A kérdés már nem az, hogy „érvényes-e", hanem hogy „miért nem használod még".</p>
    `,
  },
  "szerzodeskezeles-kkv-digitalizacio": {
    title: "5 ok, amiért a KKV-knak digitalizálniuk kell a szerződéskezelést",
    category: "Digitalizáció",
    date: "2026. február 28.",
    readTime: "5 perc",
    image: "/images/blog/szerzodeskezeles-kkv-digitalizacio.jpg",
    content: `
      <h2>Miért ragaszkodunk még a papírhoz?</h2>
      <p>A magyar KKV-k jelentős része még mindig papíron kezeli a szerződéseit. Nyomtatás, aláírás, szkennelés, e-mail — ismerős? Ez a folyamat lassú, költséges és hibalehetőségekkel teli. Íme 5 meggyőző érv a váltás mellett.</p>

      <h2>1. Időmegtakarítás</h2>
      <p>Egy hagyományos szerződéskötés átlagosan 5-7 munkanapot vesz igénybe: megszövegezés, egyeztetés, nyomtatás, postázás vagy személyes találkozó, visszaküldés. Digitálisan? 10-15 perc. Az aláíró emailben kapja a linket, és mobilról is aláírhatja.</p>

      <h2>2. Költségcsökkentés</h2>
      <p>A papír, nyomtató, toner, postai díjak és archiválási költségek évente akár több százezer forintot is kitehetnek egy KKV-nál. A digitális megoldás ezeket nullára csökkenti. A Legitas ingyenes csomagjával havi 5 szerződés teljesen ingyen kezelhető.</p>

      <h2>3. Jogi biztonság</h2>
      <p>A digitális szerződéskezelő rendszerek automatikusan biztosítják, ami papíron a te felelősséged lenne: semmit nem lehet utólag módosítani (SHA-256 hash), minden lépés naplózva van (audit trail), és a sablonok jogász által ellenőrzöttek.</p>

      <h2>4. Átláthatóság és kontroll</h2>
      <p>Hol tart az aláírás? Ki írta alá, ki nem? Mikor jár le a szerződés? Papíron ezeket fejben vagy Excel-ben tartod nyilván. Egy digitális rendszerben dashboard-on látod az összes szerződésed státuszát, emlékeztetőket kapsz a lejáratokról.</p>

      <h2>5. Távmunka és rugalmasság</h2>
      <p>A home office és a távmunka ma már alap. Ha a szerződéseid papíron vannak az irodai fiókban, nem férsz hozzájuk otthonról. A felhőalapú szerződéskezelő bárhonnan elérhető, mobilról is.</p>

      <h2>Hogyan kezdj hozzá?</h2>
      <p>Nem kell egyszerre mindent digitalizálni. Kezdd az új szerződésekkel — a meglévőket fokozatosan szkenneld be és töltsd fel. A Legitas ingyenes csomagjával kockázat nélkül kipróbálhatod a rendszert.</p>
    `,
  },
  "ptk-szerzodeskotes-alapjai": {
    title: "Szerződéskötés alapjai: amit a Ptk. mond a vállalkozásoknak",
    category: "Jogi útmutató",
    date: "2026. február 20.",
    readTime: "10 perc",
    image: "/images/blog/ptk-szerzodeskotes-alapjai.jpg",
    content: `
      <h2>A Polgári Törvénykönyv és a szerződések</h2>
      <p>A 2013. évi V. törvény (Ptk.) a magyar magánjog alapja. A szerződésekre vonatkozó szabályokat elsősorban a Hatodik Könyv tartalmazza. Minden vállalkozónak érdemes ismerni az alapokat.</p>

      <h2>A szerződés fogalma</h2>
      <p>A szerződés a felek kölcsönös és egybehangzó akaratnyilatkozata, amelyből kötelezettség keletkezik a szolgáltatás teljesítésére, és jogosultság a szolgáltatás követelésére (Ptk. 6:58. §). Egyszerűbben: két fél megállapodik valamiben, és ez jogilag kötelező érvényű.</p>

      <h2>Alaki követelmények</h2>
      <p>A Ptk. főszabály szerint nem ír elő alaki kötöttséget — a szerződés szóban, írásban és ráutaló magatartással is megköthető (Ptk. 6:63. §). Azonban bizonyos szerződéstípusoknál kötelező az írásbeli forma:</p>
      <ul>
        <li>Ingatlanra vonatkozó szerződések</li>
        <li>Kezességi szerződés</li>
        <li>Tartási és életjáradéki szerződés</li>
        <li>Jogszabály által előírt egyéb esetek</li>
      </ul>

      <h2>Érvénytelenség</h2>
      <p>Egy szerződés érvénytelen lehet semmisség (pl. jogszabályba ütközik, lehetetlen szolgáltatásra irányul) vagy megtámadhatóság (pl. tévedés, megtévesztés, fenyegetés) miatt. Az érvénytelenségre bármelyik fél hivatkozhat.</p>

      <h2>Szerződésszegés</h2>
      <p>Ha valamelyik fél nem teljesíti a vállalt kötelezettségét, szerződésszegést követ el. A Ptk. szerint a sérelmet szenvedett fél:</p>
      <ul>
        <li>Követelheti a teljesítést</li>
        <li>Elállhat a szerződéstől vagy felmondhatja azt</li>
        <li>Kártérítést követelhet</li>
        <li>Kötbért érvényesíthet (ha kikötötték)</li>
      </ul>

      <h2>Gyakorlati tippek vállalkozásoknak</h2>
      <p>Mindig írásbeli szerződést kössetek — még ha a jog nem is követeli meg. Az írásbeli forma bizonyítási szempontból sokkal erősebb. Használjatok előre elkészített, jogász által ellenőrzött sablonokat, és ne felejtsetek el minden lényeges feltételt rögzíteni: felek adatai, szolgáltatás leírása, díjazás, határidők, felmondási feltételek.</p>
    `,
  },
  "nda-titoktartasi-szerzodes-minta": {
    title: "NDA / titoktartási szerződés: mikor kell és hogyan készítsd el",
    category: "Sablonok",
    date: "2026. február 15.",
    readTime: "6 perc",
    image: "/images/blog/nda-titoktartasi-szerzodes-minta.jpg",
    content: `
      <h2>Mi az NDA?</h2>
      <p>Az NDA (Non-Disclosure Agreement), magyarul titoktartási szerződés vagy titoktartási nyilatkozat, olyan megállapodás, amelyben a felek vállalják, hogy az egymással megosztott bizalmas információkat nem hozzák nyilvánosságra és nem használják fel jogosulatlanul.</p>

      <h2>Mikor van szükség NDA-ra?</h2>
      <ul>
        <li><strong>Üzleti tárgyalások előtt</strong> — ha üzleti tervet, árazást vagy stratégiát osztasz meg egy potenciális partnerrel</li>
        <li><strong>Munkavállalók felvételekor</strong> — különösen ha hozzáférnek ügyféladatokhoz, forráskódhoz vagy üzleti titkokhoz</li>
        <li><strong>Szoftverfejlesztésnél</strong> — ha külsős fejlesztőknek adsz hozzáférést a rendszeredhez</li>
        <li><strong>Befektetés-szerzésnél</strong> — a pitch deck és a pénzügyi adatok védelme érdekében</li>
      </ul>

      <h2>Mit tartalmazzon egy jó NDA?</h2>
      <p>Egy jól megírt NDA a következő elemeket tartalmazza:</p>
      <ul>
        <li><strong>Felek meghatározása</strong> — ki az információt átadó és ki a fogadó fél</li>
        <li><strong>Bizalmas információ definíciója</strong> — mit tekintünk bizalmasnak (minél konkrétabb, annál jobb)</li>
        <li><strong>Kivételek</strong> — mi nem minősül bizalmas információnak (pl. nyilvánosan elérhető adatok)</li>
        <li><strong>Időtartam</strong> — meddig áll fenn a titoktartási kötelezettség (általában 2-5 év)</li>
        <li><strong>Szankciók</strong> — mi történik jogsértés esetén (kötbér, kártérítés)</li>
      </ul>

      <h2>Egyoldalú vs. kétoldalú NDA</h2>
      <p>Az egyoldalú NDA-ban csak az egyik fél ad át bizalmas információt (pl. munkáltató → munkavállaló). A kétoldalú (mutual) NDA mindkét felet védi — ez a gyakoribb üzleti tárgyalásoknál.</p>

      <h2>NDA készítése a Legitason</h2>
      <p>A Legitason kétoldalú NDA sablon áll rendelkezésre. Válaszd ki a sablont, töltsd ki a felek adatait és a specifikus feltételeket, majd küldd el aláírásra. Az egész folyamat 5 perc.</p>
    `,
  },
  "gdpr-szerzodes-adatvedelem": {
    title: "GDPR és szerződések: adatvédelmi kötelezettségek a vállalkozásodban",
    category: "Adatvédelem",
    date: "2026. február 10.",
    readTime: "7 perc",
    image: "/images/blog/gdpr-szerzodes-adatvedelem.jpg",
    content: `
      <h2>Miért fontos a GDPR a szerződéseidben?</h2>
      <p>A GDPR (General Data Protection Regulation, EU 2016/679) 2018 óta hatályos, és minden EU-ban működő vállalkozásra vonatkozik. Ha a szerződéseid személyes adatokat tartalmaznak — és szinte mindig tartalmaznak —, akkor adatvédelmi szempontból is megfelelőnek kell lenniük.</p>

      <h2>Adatkezelési záradék a szerződésekben</h2>
      <p>Minden olyan szerződésben, ahol személyes adatokat kezeltek, érdemes adatkezelési záradékot elhelyezni. Ez tartalmazza:</p>
      <ul>
        <li>Milyen személyes adatokat kezeltek (név, e-mail, cím stb.)</li>
        <li>Mi a jogalapja az adatkezelésnek (szerződés teljesítése, jogos érdek, hozzájárulás)</li>
        <li>Meddig tároljátok az adatokat</li>
        <li>Az érintettek jogai (hozzáférés, törlés, hordozhatóság)</li>
      </ul>

      <h2>Adatfeldolgozói megállapodás (DPA)</h2>
      <p>Ha egy külső szolgáltatóval (pl. könyvelő, felhőszolgáltató, marketing ügynökség) osztasz meg személyes adatokat, a GDPR 28. cikke szerint kötelező adatfeldolgozói megállapodást (Data Processing Agreement) kötni. Ennek tartalmaznia kell:</p>
      <ul>
        <li>Az adatfeldolgozás tárgyát és időtartamát</li>
        <li>A feldolgozás jellegét és célját</li>
        <li>Az érintetti adatok típusait</li>
        <li>Az adatkezelő utasítási jogát</li>
        <li>Biztonsági intézkedéseket</li>
        <li>Al-adatfeldolgozók bevonásának feltételeit</li>
      </ul>

      <h2>Munkaszerződések és a GDPR</h2>
      <p>A munkaszerződésekben is szerepelnie kell adatvédelmi tájékoztatásnak. A munkavállalókat informálni kell arról, hogy milyen adataikat, milyen célból és meddig kezeled. Ez külön mellékletként vagy a szerződés részeként is megoldható.</p>

      <h2>Szankciók</h2>
      <p>A GDPR megsértéséért a NAIH (Nemzeti Adatvédelmi és Információszabadság Hatóság) komoly bírságot szabhat ki — akár az éves árbevétel 4%-áig. KKV-k számára is akár milliós nagyságrendű büntetés lehetséges.</p>

      <h2>A Legitas és a GDPR</h2>
      <p>A Legitas sablonjai tartalmazzák a szükséges adatvédelmi záradékokat. Az adatfeldolgozói megállapodás sablon is elérhető. A platform maga is GDPR-kompatibilis: EU szerveren tárolunk, audit naplót vezetünk, és az adatok bármikor törölhetők.</p>
    `,
  },
  "munkaszerodes-2026-valtozasok": {
    title: "Munkaszerződés 2026: változások és kötelező elemek",
    category: "Munkajog",
    date: "2026. február 5.",
    readTime: "9 perc",
    image: "/images/blog/munkaszerodes-2026-valtozasok.jpg",
    content: `
      <h2>A munkaszerződés alapjai</h2>
      <p>A munkaszerződés a Munka Törvénykönyve (2012. évi I. törvény) szerint a munkaviszony létesítésének alapfeltétele. Írásbeli formában kell megkötni — ez alól nincs kivétel.</p>

      <h2>Kötelező tartalmi elemek</h2>
      <p>A munkaszerződésnek legalább az alábbiakat kell tartalmaznia:</p>
      <ul>
        <li><strong>Alapbér</strong> — a bruttó havi (vagy óra-) bér összege</li>
        <li><strong>Munkakör</strong> — a végzendő munka megnevezése</li>
        <li><strong>Munkavégzés helye</strong> — a telephely címe (távmunka esetén a távmunkavégzés tényét is rögzíteni kell)</li>
      </ul>

      <h2>Ajánlott, de nem kötelező elemek</h2>
      <p>A gyakorlatban érdemes a következőket is rögzíteni:</p>
      <ul>
        <li>A munkaviszony kezdete és (ha határozott idejű) vége</li>
        <li>Próbaidő tartama (max. 3 hónap)</li>
        <li>Munkaidő beosztása</li>
        <li>Szabadság mértéke</li>
        <li>Felmondási idő</li>
        <li>Versenytilalmi megállapodás</li>
        <li>Titoktartási kötelezettség</li>
      </ul>

      <h2>2026-os változások</h2>
      <p>A legfrissebb módosítások között szerepel:</p>
      <ul>
        <li><strong>Minimálbér emelés:</strong> 2026-ban a garantált bérminimum és a minimálbér is emelkedett — a munkaszerződéseket ennek megfelelően kell módosítani</li>
        <li><strong>Távmunka szabályozás:</strong> pontosított szabályok a home office keretmegállapodásokra vonatkozóan</li>
        <li><strong>Atipikus foglalkoztatás:</strong> egyszerűsített szabályok a platformmunkára és a gig economy-ra</li>
      </ul>

      <h2>Gyakori hibák</h2>
      <p>A leggyakoribb hibák a munkaszerződéseknél:</p>
      <ul>
        <li>Nem írásbeli megkötés (érvénytelen!)</li>
        <li>Hiányzó kötelező elemek (alapbér, munkakör, munkavégzés helye)</li>
        <li>Próbaidő túllépése (max. 3 hónap, határozott idejű szerződésnél arányos)</li>
        <li>Minimálbér alatti bér rögzítése</li>
        <li>Jogellenes versenytilalmi kikötés (kompenzáció nélkül)</li>
      </ul>

      <h2>Munkaszerződés a Legitason</h2>
      <p>A Legitason határozatlan és határozott idejű munkaszerződés sablon is elérhető, a 2026-os jogszabályoknak megfelelően. A sablon automatikusan tartalmazza a kötelező elemeket, és figyelmeztet, ha valami hiányzik.</p>
    `,
  },
};

export default function BlogArticleClient() {
  const { slug } = useParams<{ slug: string }>();
  const article = articles[slug];

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Cikk nem található</h1>
        <p className="text-gray-500 mb-8">A keresett cikk nem létezik vagy eltávolításra került.</p>
        <Link href="/blog" className="text-brand-teal-dark font-semibold hover:underline">
          Vissza a bloghoz
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-16">
      <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-brand-teal-dark font-medium hover:underline mb-8">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Vissza a bloghoz
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-brand-teal/10 text-brand-teal-dark">
            {article.category}
          </span>
          <span className="text-xs text-gray-400">{article.readTime} olvasás</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight mb-4">
          {article.title}
        </h1>
        <p className="text-sm text-gray-400">{article.date}</p>
      </div>

      <img src={article.image} alt={article.title} className="w-full rounded-2xl mb-8" />

      <div
        className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-li:text-gray-600 prose-a:text-brand-teal-dark"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
      />

      <div className="mt-16 pt-8 border-t">
        <div className="bg-gradient-to-br from-brand-teal-dark to-brand-teal rounded-2xl p-8 text-center">
          <h3 className="text-xl font-bold text-white mb-2">Készen állsz a digitális szerződéskezelésre?</h3>
          <p className="text-white/70 text-sm mb-6">Regisztrálj ingyen, és készítsd el az első szerződésed percek alatt.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-brand-gold hover:bg-brand-gold-dark text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg"
          >
            Ingyenes regisztráció
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

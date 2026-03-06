import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  {
    name: 'Munkaszerződés (határozatlan idejű)',
    category: 'munkajogi',
    description:
      'Határozatlan idejű munkaszerződés sablon a Munka Törvénykönyve alapján.',
    legalBasis: 'Mt. 42-44. §, Ptk. 6:58. §',
    variables: [
      { name: 'munkaltatoNeve', label: 'Munkáltató neve', type: 'text', required: true },
      { name: 'munkaltatoCime', label: 'Munkáltató címe', type: 'text', required: true },
      { name: 'munkaltatoAdoszam', label: 'Munkáltató adószáma', type: 'text', required: true },
      { name: 'munkavallaloNeve', label: 'Munkavállaló neve', type: 'text', required: true },
      { name: 'munkavallaloSzuletesiHelye', label: 'Születési hely', type: 'text', required: true },
      { name: 'munkavallaloSzuletesiIdeje', label: 'Születési idő', type: 'date', required: true },
      { name: 'munkavallaloAnyjaNeve', label: 'Anyja neve', type: 'text', required: true },
      { name: 'munkavallaloTaj', label: 'TAJ szám', type: 'text', required: true },
      { name: 'munkavallaloLakcime', label: 'Munkavállaló lakcíme', type: 'text', required: true },
      { name: 'munkakor', label: 'Munkakör', type: 'text', required: true },
      { name: 'munkavegzesHelye', label: 'Munkavégzés helye', type: 'text', required: true },
      { name: 'kezdesDatuma', label: 'Munkaviszony kezdete', type: 'date', required: true },
      { name: 'alapber', label: 'Alapbér (bruttó Ft/hó)', type: 'number', required: true },
      { name: 'munkaido', label: 'Munkaidő (óra/hét)', type: 'number', required: false },
      { name: 'probaido', label: 'Próbaidő (hónap)', type: 'number', required: false },
    ],
    contentHtml: `
<h1>MUNKASZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Munkáltató</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{munkaltatoNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{munkaltatoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{munkaltatoAdoszam}}</td></tr>
</table>
<p>mint munkáltató (a továbbiakban: <strong>Munkáltató</strong>), másrészről</p>

<h2>2. Munkavállaló</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{munkavallaloNeve}}</td></tr>
  <tr><td><strong>Születési hely, idő:</strong></td><td>{{munkavallaloSzuletesiHelye}}, {{munkavallaloSzuletesiIdeje}}</td></tr>
  <tr><td><strong>Anyja neve:</strong></td><td>{{munkavallaloAnyjaNeve}}</td></tr>
  <tr><td><strong>TAJ szám:</strong></td><td>{{munkavallaloTaj}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{munkavallaloLakcime}}</td></tr>
</table>
<p>mint munkavállaló (a továbbiakban: <strong>Munkavállaló</strong>) között az alábbi feltételekkel:</p>

<h2>3. A munkaviszony kezdete</h2>
<p>A felek megállapodnak, hogy a munkaviszony <strong>{{kezdesDatuma}}</strong> napján, határozatlan időtartamra jön létre.</p>

<h2>4. Munkakör és munkavégzés helye</h2>
<p>A Munkavállaló munkaköre: <strong>{{munkakor}}</strong></p>
<p>A munkavégzés helye: <strong>{{munkavegzesHelye}}</strong></p>

<h2>5. Munkaidő</h2>
<p>A Munkavállaló napi munkaideje: <strong>{{munkaido}}</strong> óra/hét (teljes munkaidő esetén heti 40 óra).</p>

<h2>6. Személyi alapbér</h2>
<p>A Munkavállaló személyi alapbére: havi bruttó <strong>{{alapber}}</strong> Ft, azaz ... forint.</p>
<p>A munkabér kifizetése havonta egyszer, a tárgyhónapot követő hó 10. napjáig, a Munkavállaló bankszámlájára utalással történik.</p>

<h2>7. Próbaidő</h2>
<p>A felek <strong>{{probaido}}</strong> hónap próbaidőt kötnek ki. A próbaidő alatt a munkaviszonyt bármelyik fél indokolás nélkül, azonnali hatállyal megszüntetheti.</p>

<h2>8. Egyéb rendelkezések</h2>
<p>A munkaszerződésben nem szabályozott kérdésekben a Munka Törvénykönyvéről szóló 2012. évi I. törvény rendelkezései az irányadók.</p>
<p>Jelen szerződést a felek elolvasás és értelmezés után, mint akaratukkal mindenben megegyezőt írják alá.</p>

<p style="margin-top:40px;">Kelt: ............, {{kezdesDatuma}}</p>
`,
  },
  {
    name: 'Megbízási szerződés',
    category: 'munkajogi',
    description: 'Megbízási szerződés sablon a Polgári Törvénykönyv alapján.',
    legalBasis: 'Ptk. 6:272-6:280. §',
    variables: [
      { name: 'megbizoNeve', label: 'Megbízó neve', type: 'text', required: true },
      { name: 'megbizoCime', label: 'Megbízó címe', type: 'text', required: true },
      { name: 'megbizoAdoszam', label: 'Megbízó adószáma', type: 'text', required: true },
      { name: 'megbizottNeve', label: 'Megbízott neve', type: 'text', required: true },
      { name: 'megbizottCime', label: 'Megbízott címe', type: 'text', required: true },
      { name: 'megbizottAdoszam', label: 'Megbízott adószáma', type: 'text', required: true },
      { name: 'feladatLeirasa', label: 'Feladat leírása', type: 'textarea', required: true },
      { name: 'dijazas', label: 'Megbízási díj (Ft)', type: 'number', required: true },
      { name: 'fizetesiMod', label: 'Fizetési mód', type: 'text', required: false },
      { name: 'hatarido', label: 'Teljesítési határidő', type: 'date', required: true },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true },
    ],
    contentHtml: `
<h1>MEGBÍZÁSI SZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Megbízó</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{megbizoNeve}}</td></tr>
  <tr><td><strong>Székhely/Lakcím:</strong></td><td>{{megbizoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megbizoAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megbízó</strong>), másrészről</p>

<h2>2. Megbízott</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{megbizottNeve}}</td></tr>
  <tr><td><strong>Székhely/Lakcím:</strong></td><td>{{megbizottCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megbizottAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megbízott</strong>) között az alábbi feltételekkel:</p>

<h2>3. A megbízás tárgya</h2>
<p>Megbízó megbízza, Megbízott pedig elvállalja az alábbi feladat ellátását:</p>
<p>{{feladatLeirasa}}</p>

<h2>4. Megbízási díj</h2>
<p>A Megbízó a Megbízottnak a megbízás ellátásáért <strong>{{dijazas}}</strong> Ft, azaz ... forint megbízási díjat fizet.</p>
<p>Fizetési mód: {{fizetesiMod}}</p>

<h2>5. Teljesítési határidő</h2>
<p>A Megbízott a megbízást <strong>{{hatarido}}</strong> napjáig köteles teljesíteni.</p>

<h2>6. A felek jogai és kötelezettségei</h2>
<p>A Megbízott a megbízás ellátása során a Megbízó utasításai szerint köteles eljárni, a Megbízó érdekeit szem előtt tartva, az adott helyzetben általában elvárható gondossággal.</p>
<p>A Megbízott a megbízás teljesítéséről köteles a Megbízót tájékoztatni.</p>
<p>A Megbízó köteles a megbízás teljesítéséhez szükséges tájékoztatást megadni és a szükséges feltételeket biztosítani.</p>

<h2>7. Felmondás</h2>
<p>A megbízási szerződést bármelyik fél felmondhatja. A felmondási idő 30 nap.</p>

<h2>8. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezései az irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKezdete}}</p>
`,
  },
  {
    name: 'Titoktartási megállapodás (NDA)',
    category: 'b2b',
    description:
      'Kétoldalú titoktartási megállapodás üzleti együttműködéshez.',
    legalBasis: 'Ptk. 2:46-47. §, Üzleti titok védelméről szóló 2018. évi LIV. törvény',
    variables: [
      { name: 'fel1Neve', label: '1. Fél neve', type: 'text', required: true },
      { name: 'fel1Cime', label: '1. Fél címe', type: 'text', required: true },
      { name: 'fel1Adoszam', label: '1. Fél adószáma', type: 'text', required: true },
      { name: 'fel2Neve', label: '2. Fél neve', type: 'text', required: true },
      { name: 'fel2Cime', label: '2. Fél címe', type: 'text', required: true },
      { name: 'fel2Adoszam', label: '2. Fél adószáma', type: 'text', required: true },
      { name: 'bizalmasInformaciokKore', label: 'Bizalmas információk köre', type: 'textarea', required: true },
      { name: 'titoktartasIdotartama', label: 'Titoktartás időtartama (év)', type: 'number', required: true },
      { name: 'kotberOsszeg', label: 'Kötbér összege (Ft)', type: 'number', required: false },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true },
    ],
    contentHtml: `
<h1>TITOKTARTÁSI MEGÁLLAPODÁS (NDA)</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Felek</h2>
<table>
  <tr><td><strong>1. Fél neve:</strong></td><td>{{fel1Neve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{fel1Cime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{fel1Adoszam}}</td></tr>
</table>
<p>másrészről</p>
<table>
  <tr><td><strong>2. Fél neve:</strong></td><td>{{fel2Neve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{fel2Cime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{fel2Adoszam}}</td></tr>
</table>
<p>(a továbbiakban együttesen: <strong>Felek</strong>) között az alábbi feltételekkel:</p>

<h2>2. A megállapodás célja</h2>
<p>Jelen megállapodás célja, hogy a Felek közötti üzleti együttműködés, tárgyalás vagy szerződéses kapcsolat során egymás tudomására jutó bizalmas információk védelméről gondoskodjon.</p>

<h2>3. Bizalmas információ fogalma</h2>
<p>Bizalmas információnak minősül minden olyan adat, dokumentum, know-how, üzleti terv, pénzügyi adat, technológiai megoldás, ügyféllisták és bármely egyéb információ, amelyet bármelyik Fél a másik Félnek szóban, írásban, elektronikusan vagy bármely más formában átad, és amely különösen az alábbiakat foglalja magába:</p>
<p>{{bizalmasInformaciokKore}}</p>

<h2>4. Titoktartási kötelezettség</h2>
<p>A Felek kötelezettséget vállalnak arra, hogy:</p>
<ul>
  <li>A bizalmas információkat szigorúan bizalmasan kezelik;</li>
  <li>A bizalmas információkat kizárólag a Felek közötti együttműködés céljára használják fel;</li>
  <li>A bizalmas információkat harmadik személy részére nem adják ki, nem teszik hozzáférhetővé;</li>
  <li>A bizalmas információkat legalább olyan gondossággal védik, mint saját bizalmas információikat.</li>
</ul>

<h2>5. Kivételek</h2>
<p>Nem minősül titoktartási kötelezettség megszegésének, ha az információ:</p>
<ul>
  <li>Az átadás időpontjában már nyilvánosan hozzáférhető volt;</li>
  <li>A fogadó Fél bizonyíthatóan más forrásból, jogszerűen szerezte meg;</li>
  <li>Jogszabály vagy hatósági/bírósági kötelezés alapján kell kiadni.</li>
</ul>

<h2>6. Időtartam</h2>
<p>A titoktartási kötelezettség a jelen megállapodás aláírásától számított <strong>{{titoktartasIdotartama}}</strong> évig áll fenn, függetlenül a Felek közötti egyéb jogviszony esetleges megszűnésétől.</p>

<h2>7. Jogkövetkezmények</h2>
<p>A titoktartási kötelezettség megszegése esetén a vétkes Fél <strong>{{kotberOsszeg}}</strong> Ft összegű kötbér megfizetésére köteles, amely nem érinti a másik Fél további kártérítési igényét.</p>

<h2>8. Záró rendelkezések</h2>
<p>A jelen megállapodásban nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény, valamint az üzleti titok védelméről szóló 2018. évi LIV. törvény rendelkezései az irányadók.</p>
<p>A Felek vitáikat elsősorban tárgyalás útján rendezik. Ennek eredménytelensége esetén a Felek a jogvitát a Megbízó székhelye szerint illetékes bíróság elé terjesztik.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Vállalkozási szerződés',
    category: 'munkajogi',
    description: 'Vállalkozási szerződés munka elvégzésére a Ptk. alapján.',
    legalBasis: 'Ptk. 6:238-6:250. §',
    variables: [
      { name: 'megrendeloNeve', label: 'Megrendelő neve', type: 'text', required: true },
      { name: 'megrendeloCime', label: 'Megrendelő címe', type: 'text', required: true },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true },
      { name: 'vallalkozoNeve', label: 'Vállalkozó neve', type: 'text', required: true },
      { name: 'vallalkozoCime', label: 'Vállalkozó címe', type: 'text', required: true },
      { name: 'vallalkozoAdoszam', label: 'Vállalkozó adószáma', type: 'text', required: true },
      { name: 'munkaTargya', label: 'Munka tárgya', type: 'textarea', required: true },
      { name: 'vallasiDij', label: 'Vállalási díj (Ft)', type: 'number', required: true },
      { name: 'teljesitesiHatarido', label: 'Teljesítési határidő', type: 'date', required: true },
      { name: 'szavatossagIdeje', label: 'Szavatosság ideje (hónap)', type: 'number', required: false },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true },
    ],
    contentHtml: `
<h1>VÁLLALKOZÁSI SZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Megrendelő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{megrendeloNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{megrendeloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megrendeloAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megrendelő</strong>), másrészről</p>

<h2>2. Vállalkozó</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{vallalkozoNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{vallalkozoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{vallalkozoAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Vállalkozó</strong>) között az alábbi feltételekkel:</p>

<h2>3. A vállalkozás tárgya</h2>
<p>Vállalkozó vállalja, hogy az alábbi munkát a Megrendelő részére elvégzi:</p>
<p>{{munkaTargya}}</p>

<h2>4. Vállalási díj</h2>
<p>A Megrendelő a Vállalkozónak a munka elvégzéséért <strong>{{vallasiDij}}</strong> Ft + ÁFA, azaz ... forint + ÁFA vállalási díjat fizet.</p>
<p>A vállalási díj a teljesítés igazolását követő 15 napon belül, átutalással esedékes.</p>

<h2>5. Teljesítési határidő</h2>
<p>A Vállalkozó a munkát <strong>{{teljesitesiHatarido}}</strong> napjáig köteles befejezni és a Megrendelőnek átadni.</p>

<h2>6. Teljesítés igazolása</h2>
<p>A munka elkészültéről a Vállalkozó értesíti a Megrendelőt. A Megrendelő 5 munkanapon belül köteles az átadás-átvételi eljárást lefolytatni. Ha a Megrendelő a munkát hibátlannak találja, teljesítésigazolást ad ki.</p>

<h2>7. Szavatosság</h2>
<p>A Vállalkozó az elkészült munkára <strong>{{szavatossagIdeje}}</strong> hónap szavatosságot vállal. A szavatossági idő a sikeres átadás-átvételtől számítandó.</p>

<h2>8. Késedelmi kötbér</h2>
<p>Ha a Vállalkozó a teljesítési határidőt elmulasztja, a Megrendelő a vállalási díj 0,5%-ának megfelelő napi késedelmi kötbér érvényesítésére jogosult, legfeljebb a vállalási díj 15%-áig.</p>

<h2>9. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezései az irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Szolgáltatási keretszerződés',
    category: 'b2b',
    description: 'B2B szolgáltatási keretszerződés folyamatos együttműködéshez.',
    legalBasis: 'Ptk. 6:58. §, 6:77-78. §',
    variables: [
      { name: 'megrendeloCeg', label: 'Megrendelő cég neve', type: 'text', required: true },
      { name: 'megrendeloCime', label: 'Megrendelő székhelye', type: 'text', required: true },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true },
      { name: 'megrendeloKepviselo', label: 'Megrendelő képviselője', type: 'text', required: true },
      { name: 'szolgaltatoCeg', label: 'Szolgáltató cég neve', type: 'text', required: true },
      { name: 'szolgaltatoCime', label: 'Szolgáltató székhelye', type: 'text', required: true },
      { name: 'szolgaltatoAdoszam', label: 'Szolgáltató adószáma', type: 'text', required: true },
      { name: 'szolgaltatoKepviselo', label: 'Szolgáltató képviselője', type: 'text', required: true },
      { name: 'szolgaltatasLeirasa', label: 'Szolgáltatás leírása', type: 'textarea', required: true },
      { name: 'haviDij', label: 'Havi díj (Ft + ÁFA)', type: 'number', required: true },
      { name: 'fizetesiHatarido', label: 'Fizetési határidő (nap)', type: 'number', required: true },
      { name: 'szerzodesIdotartama', label: 'Szerződés időtartama', type: 'text', required: true },
      { name: 'felmondasiIdo', label: 'Felmondási idő (nap)', type: 'number', required: true },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true },
    ],
    contentHtml: `
<h1>SZOLGÁLTATÁSI KERETSZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Megrendelő</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{megrendeloCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{megrendeloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megrendeloAdoszam}}</td></tr>
  <tr><td><strong>Képviseli:</strong></td><td>{{megrendeloKepviselo}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megrendelő</strong>), másrészről</p>

<h2>2. Szolgáltató</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{szolgaltatoCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{szolgaltatoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{szolgaltatoAdoszam}}</td></tr>
  <tr><td><strong>Képviseli:</strong></td><td>{{szolgaltatoKepviselo}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Szolgáltató</strong>) között az alábbi feltételekkel:</p>

<h2>3. A szerződés tárgya</h2>
<p>Szolgáltató vállalja az alábbi szolgáltatások folyamatos nyújtását a Megrendelő részére:</p>
<p>{{szolgaltatasLeirasa}}</p>

<h2>4. Szolgáltatási díj</h2>
<p>A szolgáltatás havi díja: <strong>{{haviDij}}</strong> Ft + ÁFA.</p>
<p>A Szolgáltató havonta, a tárgyhónap végén állítja ki számláját. A fizetési határidő a számla kézhezvételétől számított <strong>{{fizetesiHatarido}}</strong> nap.</p>

<h2>5. A szerződés időtartama</h2>
<p>Jelen szerződés <strong>{{szerzodesKezdete}}</strong> napjától <strong>{{szerzodesIdotartama}}</strong> időtartamra jön létre.</p>

<h2>6. Felmondás</h2>
<p>A szerződést bármelyik fél rendes felmondással, <strong>{{felmondasiIdo}}</strong> napos felmondási idővel mondhatja fel. A felmondást írásban kell közölni.</p>
<p>Súlyos szerződésszegés esetén bármelyik fél jogosult a szerződést azonnali hatállyal felmondani.</p>

<h2>7. Szolgáltatási szint (SLA)</h2>
<p>A Szolgáltató vállalja, hogy a szolgáltatást a szokásos üzleti gyakorlatnak megfelelő minőségben nyújtja. Hibák esetén az értesítéstől számított 24 órán belül megkezdi a javítást.</p>

<h2>8. Titoktartás</h2>
<p>Mindkét fél köteles a szerződés teljesítése során tudomására jutó üzleti titkokat megőrizni.</p>

<h2>9. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezései az irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKezdete}}</p>
`,
  },
  {
    name: 'Együttműködési megállapodás',
    category: 'b2b',
    description: 'Együttműködési megállapodás két cég közötti stratégiai partnerséghez.',
    legalBasis: 'Ptk. 6:58. §',
    variables: [
      { name: 'ceg1Neve', label: '1. Cég neve', type: 'text', required: true },
      { name: 'ceg1Cime', label: '1. Cég székhelye', type: 'text', required: true },
      { name: 'ceg1Adoszam', label: '1. Cég adószáma', type: 'text', required: true },
      { name: 'ceg1Kepviselo', label: '1. Cég képviselője', type: 'text', required: true },
      { name: 'ceg2Neve', label: '2. Cég neve', type: 'text', required: true },
      { name: 'ceg2Cime', label: '2. Cég székhelye', type: 'text', required: true },
      { name: 'ceg2Adoszam', label: '2. Cég adószáma', type: 'text', required: true },
      { name: 'ceg2Kepviselo', label: '2. Cég képviselője', type: 'text', required: true },
      { name: 'egyuttmukodesCelja', label: 'Együttműködés célja', type: 'textarea', required: true },
      { name: 'feladatmegosztas', label: 'Feladatmegosztás', type: 'textarea', required: true },
      { name: 'bevetelMegosztas', label: 'Bevétel megosztás', type: 'text', required: false },
      { name: 'idotartam', label: 'Időtartam', type: 'text', required: true },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true },
    ],
    contentHtml: `
<h1>EGYÜTTMŰKÖDÉSI MEGÁLLAPODÁS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Felek</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{ceg1Neve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{ceg1Cime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{ceg1Adoszam}}</td></tr>
  <tr><td><strong>Képviseli:</strong></td><td>{{ceg1Kepviselo}}</td></tr>
</table>
<p>másrészről</p>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{ceg2Neve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{ceg2Cime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{ceg2Adoszam}}</td></tr>
  <tr><td><strong>Képviseli:</strong></td><td>{{ceg2Kepviselo}}</td></tr>
</table>
<p>(a továbbiakban együttesen: <strong>Felek</strong>) között az alábbi feltételekkel:</p>

<h2>2. Az együttműködés célja</h2>
<p>{{egyuttmukodesCelja}}</p>

<h2>3. Feladatmegosztás</h2>
<p>{{feladatmegosztas}}</p>

<h2>4. Bevétel megosztás</h2>
<p>{{bevetelMegosztas}}</p>

<h2>5. Időtartam</h2>
<p>Jelen megállapodás <strong>{{idotartam}}</strong> időtartamra jön létre.</p>

<h2>6. Titoktartás</h2>
<p>A Felek kötelesek az együttműködés során megismert bizalmas információkat üzleti titokként kezelni. Ez a kötelezettség a megállapodás megszűnését követően is fennáll.</p>

<h2>7. Felmondás</h2>
<p>A megállapodást bármelyik Fél 60 napos felmondási idővel mondhatja fel. Rendkívüli felmondásra súlyos szerződésszegés esetén van lehetőség.</p>

<h2>8. Szellemi tulajdon</h2>
<p>Az együttműködés során létrejövő szellemi termékek a Feleket egyenlő arányban illetik meg, eltérő megállapodás hiányában.</p>

<h2>9. Záró rendelkezések</h2>
<p>A jelen megállapodásban nem szabályozott kérdésekben a Ptk. rendelkezései az irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Lakásbérleti szerződés',
    category: 'ingatlan',
    description: 'Lakásbérleti szerződés magánszemélyek között.',
    legalBasis: 'Ptk. 6:331-6:342. §, 1993. évi LXXVIII. tv.',
    variables: [
      { name: 'berbeadoNeve', label: 'Bérbeadó neve', type: 'text', required: true },
      { name: 'berbeadoSzemelyiIg', label: 'Bérbeadó személyi ig. száma', type: 'text', required: true },
      { name: 'berbeadoAdoazonosito', label: 'Bérbeadó adóazonosító jele', type: 'text', required: true },
      { name: 'berbeadoLakcime', label: 'Bérbeadó lakcíme', type: 'text', required: true },
      { name: 'berloNeve', label: 'Bérlő neve', type: 'text', required: true },
      { name: 'berloSzemelyiIg', label: 'Bérlő személyi ig. száma', type: 'text', required: true },
      { name: 'berloAdoazonosito', label: 'Bérlő adóazonosító jele', type: 'text', required: true },
      { name: 'ingatlanCim', label: 'Ingatlan címe', type: 'text', required: true },
      { name: 'hrsz', label: 'Helyrajzi szám', type: 'text', required: true },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true },
      { name: 'szobaszam', label: 'Szobaszám', type: 'text', required: true },
      { name: 'berletiDij', label: 'Havi bérleti díj (Ft)', type: 'number', required: true },
      { name: 'kaucio', label: 'Kaució (Ft)', type: 'number', required: true },
      { name: 'kezdesDatuma', label: 'Bérleti jogviszony kezdete', type: 'date', required: true },
      { name: 'felmondasiIdo', label: 'Felmondási idő (nap)', type: 'number', required: true },
      { name: 'rezsiElszamolas', label: 'Rezsi elszámolás módja', type: 'text', required: false },
      { name: 'haziallatEngedely', label: 'Háziállat tartása', type: 'text', required: false },
    ],
    contentHtml: `
<h1>LAKÁSBÉRLETI SZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Bérbeadó</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{berbeadoNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{berbeadoSzemelyiIg}}</td></tr>
  <tr><td><strong>Adóazonosító jel:</strong></td><td>{{berbeadoAdoazonosito}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{berbeadoLakcime}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Bérbeadó</strong>), másrészről</p>

<h2>2. Bérlő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{berloNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{berloSzemelyiIg}}</td></tr>
  <tr><td><strong>Adóazonosító jel:</strong></td><td>{{berloAdoazonosito}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Bérlő</strong>) között az alábbi feltételekkel:</p>

<h2>3. A bérlemény</h2>
<table>
  <tr><td><strong>Cím:</strong></td><td>{{ingatlanCim}}</td></tr>
  <tr><td><strong>Hrsz.:</strong></td><td>{{hrsz}}</td></tr>
  <tr><td><strong>Alapterület:</strong></td><td>{{alapterulet}} m<sup>2</sup></td></tr>
  <tr><td><strong>Szobaszám:</strong></td><td>{{szobaszam}}</td></tr>
</table>
<p>A Bérbeadó a fent megjelölt ingatlant rendeltetésszerű lakás céljára adja bérbe a Bérlőnek.</p>

<h2>4. Bérleti díj</h2>
<p>A havi bérleti díj: <strong>{{berletiDij}}</strong> Ft, azaz ... forint.</p>
<p>A bérleti díj minden hónap 5. napjáig esedékes, a Bérbeadó bankszámlájára történő átutalással.</p>
<p>Rezsi elszámolás: {{rezsiElszamolas}}</p>

<h2>5. Kaució</h2>
<p>A Bérlő a szerződés aláírásakor <strong>{{kaucio}}</strong> Ft összegű kauciót fizet. A kauciót a Bérbeadó a bérlemény rendeltetésszerű visszaadásakor, a fennálló tartozások levonása után 15 napon belül visszafizeti.</p>

<h2>6. A bérleti jogviszony időtartama</h2>
<p>A bérleti jogviszony <strong>{{kezdesDatuma}}</strong> napjától határozatlan időre jön létre.</p>

<h2>7. Felmondás</h2>
<p>A szerződést bármelyik fél <strong>{{felmondasiIdo}}</strong> napos felmondási idővel, a hónap utolsó napjára mondhatja fel.</p>
<p>Azonnali felmondásra a Bérbeadó jogosult, ha a Bérlő: a) a bérleti díjjal 2 hónapot meghaladó mértékben elmarad; b) a bérleményt rongálja vagy nem rendeltetésszerűen használja; c) a társbérlőkkel vagy szomszédokkal szemben tűrhetetlen magatartást tanúsít.</p>

<h2>8. A Bérlő kötelezettségei</h2>
<ul>
  <li>A bérleményt rendeltetésszerűen használja</li>
  <li>A kisjavításokat saját költségén elvégzi</li>
  <li>A bérleményt albérletbe nem adja a Bérbeadó előzetes írásbeli hozzájárulása nélkül</li>
  <li>A bérlemény visszaadásakor azt az átvételkori állapotnak megfelelő állapotban adja vissza</li>
</ul>

<h2>9. Háziállat tartása</h2>
<p>{{haziallatEngedely}}</p>

<h2>10. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Ptk. és a lakások és helyiségek bérletére vonatkozó jogszabályok rendelkezései az irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{kezdesDatuma}}</p>
`,
  },
  {
    name: 'Irodabérleti szerződés',
    category: 'ingatlan',
    description: 'Irodabérleti szerződés cégek között.',
    legalBasis: 'Ptk. 6:331-6:342. §',
    variables: [
      { name: 'berbeadoCeg', label: 'Bérbeadó cég neve', type: 'text', required: true },
      { name: 'berbeadoCime', label: 'Bérbeadó székhelye', type: 'text', required: true },
      { name: 'berbeadoAdoszam', label: 'Bérbeadó adószáma', type: 'text', required: true },
      { name: 'berloCeg', label: 'Bérlő cég neve', type: 'text', required: true },
      { name: 'berloCime', label: 'Bérlő székhelye', type: 'text', required: true },
      { name: 'berloAdoszam', label: 'Bérlő adószáma', type: 'text', required: true },
      { name: 'irodaCim', label: 'Iroda címe', type: 'text', required: true },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true },
      { name: 'berletiDijHuf', label: 'Havi bérleti díj (Ft + ÁFA)', type: 'number', required: true },
      { name: 'kaucio', label: 'Kaució (havi díj többszöröse)', type: 'text', required: true },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true },
      { name: 'szerzodesVege', label: 'Szerződés vége', type: 'date', required: true },
    ],
    contentHtml: `
<h1>IRODABÉRLETI SZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Bérbeadó</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{berbeadoCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{berbeadoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{berbeadoAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Bérbeadó</strong>), másrészről</p>

<h2>2. Bérlő</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{berloCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{berloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{berloAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Bérlő</strong>) között az alábbi feltételekkel:</p>

<h2>3. Bérlemény</h2>
<p>Bérbeadó bérbe adja, Bérlő bérbe veszi a <strong>{{irodaCim}}</strong> cím alatt található, <strong>{{alapterulet}}</strong> m<sup>2</sup> alapterületű irodahelyiséget irodai célú használatra.</p>

<h2>4. Bérleti díj és fizetési feltételek</h2>
<p>Havi bérleti díj: <strong>{{berletiDijHuf}}</strong> Ft + ÁFA.</p>
<p>A bérleti díj havonta, a tárgyhónap első munkanapjáig esedékes.</p>
<p>A bérleti díj évente egyszer, a KSH által közzétett fogyasztói árindex mértékével emelkedik.</p>

<h2>5. Kaució</h2>
<p>Bérlő a szerződés aláírásával egyidejűleg <strong>{{kaucio}}</strong> összegű óvadékot fizet, amelyet a Bérbeadó a bérleti jogviszony szabályszerű megszűnése esetén 30 napon belül visszafizet.</p>

<h2>6. Időtartam</h2>
<p>A szerződés határozott időre szól: <strong>{{szerzodesKezdete}}</strong> – <strong>{{szerzodesVege}}</strong>.</p>
<p>A szerződés a felek kölcsönös megegyezésével meghosszabbítható.</p>

<h2>7. Üzemeltetési költségek</h2>
<p>A közüzemi díjakat (villany, víz, fűtés, internet) a Bérlő közvetlenül a szolgáltatók felé fizeti. A közös költséget a Bérbeadó számlája alapján a Bérlő viseli.</p>

<h2>8. Karbantartás, felújítás</h2>
<p>A kisjavítások a Bérlőt, a nagyobb karbantartási munkálatok a Bérbeadót terhelik. Bérlő az irodában átalakítást csak a Bérbeadó előzetes írásbeli hozzájárulásával végezhet.</p>

<h2>9. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Ptk. rendelkezései irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKezdete}}</p>
`,
  },
  {
    name: 'Ingatlan adásvételi előszerződés',
    category: 'ingatlan',
    description: 'Ingatlan adásvételi előszerződés foglalóval.',
    legalBasis: 'Ptk. 6:73. §, 6:185-6:195. §',
    variables: [
      { name: 'eladoNeve', label: 'Eladó neve', type: 'text', required: true },
      { name: 'eladoSzemelyiIg', label: 'Eladó személyi ig. száma', type: 'text', required: true },
      { name: 'eladoAdoazonosito', label: 'Eladó adóazonosító jele', type: 'text', required: true },
      { name: 'eladoLakcime', label: 'Eladó lakcíme', type: 'text', required: true },
      { name: 'vevoNeve', label: 'Vevő neve', type: 'text', required: true },
      { name: 'vevoSzemelyiIg', label: 'Vevő személyi ig. száma', type: 'text', required: true },
      { name: 'vevoAdoazonosito', label: 'Vevő adóazonosító jele', type: 'text', required: true },
      { name: 'vevoLakcime', label: 'Vevő lakcíme', type: 'text', required: true },
      { name: 'ingatlanCim', label: 'Ingatlan címe', type: 'text', required: true },
      { name: 'hrsz', label: 'Helyrajzi szám', type: 'text', required: true },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true },
      { name: 'vetelAr', label: 'Vételár (Ft)', type: 'number', required: true },
      { name: 'foglaloOsszeg', label: 'Foglaló összege (Ft)', type: 'number', required: true },
      { name: 'teljesitesiHatarido', label: 'Végleges szerződéskötés határideje', type: 'date', required: true },
      { name: 'szerzodesKelte', label: 'Előszerződés kelte', type: 'date', required: true },
    ],
    contentHtml: `
<h1>INGATLAN ADÁSVÉTELI ELŐSZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Eladó</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{eladoNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{eladoSzemelyiIg}}</td></tr>
  <tr><td><strong>Adóazonosító jel:</strong></td><td>{{eladoAdoazonosito}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{eladoLakcime}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Eladó</strong>), másrészről</p>

<h2>2. Vevő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{vevoNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{vevoSzemelyiIg}}</td></tr>
  <tr><td><strong>Adóazonosító jel:</strong></td><td>{{vevoAdoazonosito}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{vevoLakcime}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Vevő</strong>) között az alábbi feltételekkel:</p>

<h2>3. Előszerződés tárgya</h2>
<p>A Felek kijelentik, hogy az alábbi ingatlanra vonatkozóan végleges adásvételi szerződés megkötésére kötelezettséget vállalnak:</p>
<table>
  <tr><td><strong>Cím:</strong></td><td>{{ingatlanCim}}</td></tr>
  <tr><td><strong>Helyrajzi szám:</strong></td><td>{{hrsz}}</td></tr>
  <tr><td><strong>Alapterület:</strong></td><td>{{alapterulet}} m<sup>2</sup></td></tr>
</table>

<h2>4. Vételár</h2>
<p>Az ingatlan vételára: <strong>{{vetelAr}}</strong> Ft, azaz ... forint.</p>

<h2>5. Foglaló</h2>
<p>A Vevő jelen előszerződés aláírásakor <strong>{{foglaloOsszeg}}</strong> Ft, azaz ... forint foglalót fizet az Eladónak.</p>
<p>A foglaló a vételárba beszámít. Ha a végleges szerződés megkötése a Vevő érdekkörében felmerült okból hiúsul meg, a foglaló az Eladónál marad. Ha az Eladó érdekkörében felmerült okból hiúsul meg, a foglaló kétszeresét köteles visszafizetni (Ptk. 6:185. §).</p>

<h2>6. Végleges szerződéskötés</h2>
<p>A Felek kötelezik magukat, hogy a végleges adásvételi szerződést legkésőbb <strong>{{teljesitesiHatarido}}</strong> napjáig megkötik ügyvédi ellenjegyzéssel.</p>

<h2>7. Eladó nyilatkozatai</h2>
<p>Az Eladó kijelenti, hogy:</p>
<ul>
  <li>Az ingatlan kizárólagos tulajdonosa</li>
  <li>Az ingatlan per-, teher- és igénymentes (vagy a terheket felsorolja)</li>
  <li>Az ingatlanra vonatkozó harmadik személy elővásárlási joggal nem rendelkezik</li>
  <li>A közüzemi díjak naprakészen rendezve vannak</li>
</ul>

<h2>8. Záró rendelkezések</h2>
<p>A jelen előszerződésben nem szabályozott kérdésekben a Ptk. rendelkezései irányadók.</p>
<p><em>A Felek tudomásul veszik, hogy a végleges adásvételi szerződés ingatlan-nyilvántartási bejegyzéshez ügyvédi ellenjegyzés szükséges.</em></p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Megrendelő lap (általános)',
    category: 'fogyasztoi',
    description: 'Általános megrendelő lap termékekhez vagy szolgáltatásokhoz.',
    legalBasis: 'Ptk. 6:58. §, Fogyasztóvédelmi tv.',
    variables: [
      { name: 'vallalkozasNeve', label: 'Vállalkozás neve', type: 'text', required: true },
      { name: 'vallalkozasCime', label: 'Vállalkozás címe', type: 'text', required: true },
      { name: 'vallalkozasAdoszam', label: 'Vállalkozás adószáma', type: 'text', required: true },
      { name: 'ugyfelNeve', label: 'Ügyfél neve', type: 'text', required: true },
      { name: 'ugyfelCime', label: 'Ügyfél címe', type: 'text', required: true },
      { name: 'ugyfelTelefon', label: 'Ügyfél telefonszáma', type: 'text', required: false },
      { name: 'ugyfelEmail', label: 'Ügyfél email címe', type: 'text', required: false },
      { name: 'termekSzolgaltatas', label: 'Termék / Szolgáltatás megnevezése', type: 'textarea', required: true },
      { name: 'mennyiseg', label: 'Mennyiség', type: 'text', required: true },
      { name: 'egysegarHuf', label: 'Egységár (Ft)', type: 'number', required: true },
      { name: 'teljesOsszeg', label: 'Teljes összeg (Ft)', type: 'number', required: true },
      { name: 'teljesitesiHatarido', label: 'Teljesítési határidő', type: 'date', required: true },
      { name: 'fizetesiMod', label: 'Fizetési mód', type: 'text', required: true },
      { name: 'szallitasiCim', label: 'Szállítási cím', type: 'text', required: false },
      { name: 'megrendelesKelte', label: 'Megrendelés kelte', type: 'date', required: true },
    ],
    contentHtml: `
<h1>MEGRENDELŐ LAP</h1>

<h2>1. Szolgáltató / Eladó</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{vallalkozasNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{vallalkozasCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{vallalkozasAdoszam}}</td></tr>
</table>

<h2>2. Megrendelő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{ugyfelNeve}}</td></tr>
  <tr><td><strong>Cím:</strong></td><td>{{ugyfelCime}}</td></tr>
  <tr><td><strong>Telefon:</strong></td><td>{{ugyfelTelefon}}</td></tr>
  <tr><td><strong>Email:</strong></td><td>{{ugyfelEmail}}</td></tr>
</table>

<h2>3. Megrendelt termék / szolgáltatás</h2>
<table>
  <tr>
    <th>Megnevezés</th>
    <th>Mennyiség</th>
    <th>Egységár</th>
    <th>Összeg</th>
  </tr>
  <tr>
    <td>{{termekSzolgaltatas}}</td>
    <td>{{mennyiseg}}</td>
    <td>{{egysegarHuf}} Ft</td>
    <td><strong>{{teljesOsszeg}} Ft</strong></td>
  </tr>
</table>

<h2>4. Teljesítési határidő</h2>
<p>A megrendelt termék/szolgáltatás teljesítési határideje: <strong>{{teljesitesiHatarido}}</strong></p>

<h2>5. Fizetési feltételek</h2>
<p>Fizetési mód: <strong>{{fizetesiMod}}</strong></p>

<h2>6. Szállítási cím</h2>
<p>{{szallitasiCim}}</p>

<h2>7. Általános feltételek</h2>
<ul>
  <li>A megrendelés a Szolgáltató visszaigazolásával válik hatályossá.</li>
  <li>A Megrendelő 14 napon belül indokolás nélkül elállhat a szerződéstől (távollévők között kötött szerződés esetén).</li>
  <li>Reklamáció esetén a fogyasztóvédelmi jogszabályok az irányadók.</li>
</ul>

<p style="margin-top:40px;">Kelt: ............, {{megrendelesKelte}}</p>
`,
  },
];

async function main() {
  console.log('Seeding database...');

  for (const t of templates) {
    const existing = await prisma.template.findFirst({
      where: { name: t.name, isPublic: true },
    });
    if (!existing) {
      await prisma.template.create({
        data: {
          name: t.name,
          category: t.category,
          description: t.description,
          contentHtml: t.contentHtml,
          variables: JSON.stringify(t.variables),
          isPublic: true,
          legalBasis: t.legalBasis,
        },
      });
      console.log(`Created template: ${t.name}`);
    } else {
      console.log(`Template already exists: ${t.name}`);
    }
  }

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

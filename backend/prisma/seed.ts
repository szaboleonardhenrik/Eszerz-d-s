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
      { name: 'munkaltatoNeve', label: 'Munkáltató neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'munkaltatoCime', label: 'Munkáltató címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'munkaltatoAdoszam', label: 'Munkáltató adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'munkavallaloNeve', label: 'Munkavállaló neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkavallaloSzuletesiHelye', label: 'Születési hely', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkavallaloSzuletesiIdeje', label: 'Születési idő', type: 'date', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkavallaloAnyjaNeve', label: 'Anyja neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkavallaloTaj', label: 'TAJ szám', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkavallaloLakcime', label: 'Munkavállaló lakcíme', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkakor', label: 'Munkakör', type: 'text', required: true, filledBy: 'creator' },
      { name: 'munkavegzesHelye', label: 'Munkavégzés helye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'kezdesDatuma', label: 'Munkaviszony kezdete', type: 'date', required: true, filledBy: 'creator' },
      { name: 'alapber', label: 'Alapbér (bruttó Ft/hó)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'munkaido', label: 'Munkaidő (óra/hét)', type: 'number', required: false, filledBy: 'creator' },
      { name: 'probaido', label: 'Próbaidő (hónap)', type: 'number', required: false, filledBy: 'creator' },
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

<p style="margin-top:40px;">Kelt: ............, .............. év .............. hó .............. nap</p>
<p style="font-style:italic;color:#666;font-size:0.9em;">(A szerződés kelte az aláírás pillanata.)</p>
`,
  },
  {
    name: 'Megbízási szerződés',
    category: 'polgári jogi',
    description: 'Megbízási szerződés sablon a Polgári Törvénykönyv alapján.',
    legalBasis: 'Ptk. 6:272-6:280. §',
    variables: [
      { name: 'megbizoNeve', label: 'Megbízó neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megbizoCime', label: 'Megbízó címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megbizoAdoszam', label: 'Megbízó adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megbizottNeve', label: 'Megbízott neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megbizottCime', label: 'Megbízott címe', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megbizottAdoszam', label: 'Megbízott adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'feladatLeirasa', label: 'Feladat leírása', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'dijazas', label: 'Megbízási díj (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'fizetesiMod', label: 'Fizetési mód', type: 'text', required: false, filledBy: 'creator' },
      { name: 'hatarido', label: 'Teljesítési határidő', type: 'date', required: true, filledBy: 'creator' },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'fel1Neve', label: '1. Fél neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'fel1Cime', label: '1. Fél címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'fel1Adoszam', label: '1. Fél adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'fel2Neve', label: '2. Fél neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'fel2Cime', label: '2. Fél címe', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'fel2Adoszam', label: '2. Fél adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'bizalmasInformaciokKore', label: 'Bizalmas információk köre', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'titoktartasIdotartama', label: 'Titoktartás időtartama (év)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'kotberOsszeg', label: 'Kötbér összege (Ft)', type: 'number', required: false, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
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
    category: 'polgári jogi',
    description: 'Vállalkozási szerződés munka elvégzésére a Ptk. alapján.',
    legalBasis: 'Ptk. 6:238-6:250. §',
    variables: [
      { name: 'megrendeloNeve', label: 'Megrendelő neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megrendeloCime', label: 'Megrendelő címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'vallalkozoNeve', label: 'Vállalkozó neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'vallalkozoCime', label: 'Vállalkozó címe', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'vallalkozoAdoszam', label: 'Vállalkozó adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'munkaTargya', label: 'Munka tárgya', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'vallasiDij', label: 'Vállalási díj (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'teljesitesiHatarido', label: 'Teljesítési határidő', type: 'date', required: true, filledBy: 'creator' },
      { name: 'szavatossagIdeje', label: 'Szavatosság ideje (hónap)', type: 'number', required: false, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'megrendeloCeg', label: 'Megrendelő cég neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloCime', label: 'Megrendelő székhelye', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloKepviselo', label: 'Megrendelő képviselője', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'szolgaltatoCeg', label: 'Szolgáltató cég neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoCime', label: 'Szolgáltató székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoAdoszam', label: 'Szolgáltató adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoKepviselo', label: 'Szolgáltató képviselője', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatasLeirasa', label: 'Szolgáltatás leírása', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'haviDij', label: 'Havi díj (Ft + ÁFA)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'fizetesiHatarido', label: 'Fizetési határidő (nap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'szerzodesIdotartama', label: 'Szerződés időtartama', type: 'text', required: true, filledBy: 'creator' },
      { name: 'felmondasiIdo', label: 'Felmondási idő (nap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'ceg1Neve', label: '1. Cég neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'ceg1Cime', label: '1. Cég székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'ceg1Adoszam', label: '1. Cég adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'ceg1Kepviselo', label: '1. Cég képviselője', type: 'text', required: true, filledBy: 'creator' },
      { name: 'ceg2Neve', label: '2. Cég neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ceg2Cime', label: '2. Cég székhelye', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ceg2Adoszam', label: '2. Cég adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ceg2Kepviselo', label: '2. Cég képviselője', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'egyuttmukodesCelja', label: 'Együttműködés célja', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'feladatmegosztas', label: 'Feladatmegosztás', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'bevetelMegosztas', label: 'Bevétel megosztás', type: 'text', required: false, filledBy: 'creator' },
      { name: 'idotartam', label: 'Időtartam', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'berbeadoNeve', label: 'Bérbeadó neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berbeadoSzemelyiIg', label: 'Bérbeadó személyi ig. száma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berbeadoAdoazonosito', label: 'Bérbeadó adóazonosító jele', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berbeadoLakcime', label: 'Bérbeadó lakcíme', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berloNeve', label: 'Bérlő neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'berloSzemelyiIg', label: 'Bérlő személyi ig. száma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'berloAdoazonosito', label: 'Bérlő adóazonosító jele', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ingatlanCim', label: 'Ingatlan címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'hrsz', label: 'Helyrajzi szám', type: 'text', required: true, filledBy: 'creator' },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'szobaszam', label: 'Szobaszám', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berletiDij', label: 'Havi bérleti díj (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'kaucio', label: 'Kaució (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'kezdesDatuma', label: 'Bérleti jogviszony kezdete', type: 'date', required: true, filledBy: 'creator' },
      { name: 'felmondasiIdo', label: 'Felmondási idő (nap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'rezsiElszamolas', label: 'Rezsi elszámolás módja', type: 'text', required: false, filledBy: 'creator' },
      { name: 'haziallatEngedely', label: 'Háziállat tartása', type: 'text', required: false, filledBy: 'creator' },
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
      { name: 'berbeadoCeg', label: 'Bérbeadó cég neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berbeadoCime', label: 'Bérbeadó székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berbeadoAdoszam', label: 'Bérbeadó adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'berloCeg', label: 'Bérlő cég neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'berloCime', label: 'Bérlő székhelye', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'berloAdoszam', label: 'Bérlő adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'irodaCim', label: 'Iroda címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'berletiDijHuf', label: 'Havi bérleti díj (Ft + ÁFA)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'kaucio', label: 'Kaució (havi díj többszöröse)', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szerzodesKezdete', label: 'Szerződés kezdete', type: 'date', required: true, filledBy: 'creator' },
      { name: 'szerzodesVege', label: 'Szerződés vége', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'eladoNeve', label: 'Eladó neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'eladoSzemelyiIg', label: 'Eladó személyi ig. száma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'eladoAdoazonosito', label: 'Eladó adóazonosító jele', type: 'text', required: true, filledBy: 'creator' },
      { name: 'eladoLakcime', label: 'Eladó lakcíme', type: 'text', required: true, filledBy: 'creator' },
      { name: 'vevoNeve', label: 'Vevő neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'vevoSzemelyiIg', label: 'Vevő személyi ig. száma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'vevoAdoazonosito', label: 'Vevő adóazonosító jele', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'vevoLakcime', label: 'Vevő lakcíme', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ingatlanCim', label: 'Ingatlan címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'hrsz', label: 'Helyrajzi szám', type: 'text', required: true, filledBy: 'creator' },
      { name: 'alapterulet', label: 'Alapterület (m2)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'vetelAr', label: 'Vételár (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'foglaloOsszeg', label: 'Foglaló összege (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'teljesitesiHatarido', label: 'Végleges szerződéskötés határideje', type: 'date', required: true, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Előszerződés kelte', type: 'date', required: true, filledBy: 'creator' },
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
      { name: 'vallalkozasNeve', label: 'Vállalkozás neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'vallalkozasCime', label: 'Vállalkozás címe', type: 'text', required: true, filledBy: 'creator' },
      { name: 'vallalkozasAdoszam', label: 'Vállalkozás adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'ugyfelNeve', label: 'Ügyfél neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ugyfelCime', label: 'Ügyfél címe', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'ugyfelTelefon', label: 'Ügyfél telefonszáma', type: 'text', required: false, filledBy: 'signer', signerIndex: 0 },
      { name: 'ugyfelEmail', label: 'Ügyfél email címe', type: 'text', required: false, filledBy: 'signer', signerIndex: 0 },
      { name: 'termekSzolgaltatas', label: 'Termék / Szolgáltatás megnevezése', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'mennyiseg', label: 'Mennyiség', type: 'text', required: true, filledBy: 'creator' },
      { name: 'egysegarHuf', label: 'Egységár (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'teljesOsszeg', label: 'Teljes összeg (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'teljesitesiHatarido', label: 'Teljesítési határidő', type: 'date', required: true, filledBy: 'creator' },
      { name: 'fizetesiMod', label: 'Fizetési mód', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szallitasiCim', label: 'Szállítási cím', type: 'text', required: false, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendelesKelte', label: 'Megrendelés kelte', type: 'date', required: true, filledBy: 'creator' },
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
  {
    name: 'Általános Szerződési Feltételek (ÁSZF)',
    category: 'fogyasztoi',
    description: 'ÁSZF sablon webshopokhoz és online szolgáltatásokhoz.',
    legalBasis: 'Ptk. 6:77-78. §, Eker. tv. (2001. évi CVIII. tv.), Fgytv.',
    variables: [
      { name: 'szolgaltatoNeve', label: 'Szolgáltató neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoCime', label: 'Szolgáltató székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoAdoszam', label: 'Szolgáltató adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoCegjegyzek', label: 'Cégjegyzékszám', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoEmail', label: 'Ügyfélszolgálat email', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szolgaltatoTelefon', label: 'Ügyfélszolgálat telefon', type: 'text', required: false, filledBy: 'creator' },
      { name: 'weboldalUrl', label: 'Weboldal URL', type: 'text', required: true, filledBy: 'creator' },
      { name: 'tevekenysegiKor', label: 'Tevékenységi kör leírása', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'fizetesiModok', label: 'Elfogadott fizetési módok', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'szallitasiIdo', label: 'Szállítási idő (munkanap)', type: 'number', required: false, filledBy: 'creator' },
      { name: 'elallasHatarido', label: 'Elállási határidő (nap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'hatalybaLepes', label: 'Hatályba lépés dátuma', type: 'date', required: true, filledBy: 'creator' },
    ],
    contentHtml: `
<h1>ÁLTALÁNOS SZERZŐDÉSI FELTÉTELEK</h1>
<p><em>Hatályos: {{hatalybaLepes}} napjától</em></p>

<h2>1. A Szolgáltató adatai</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{szolgaltatoNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{szolgaltatoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{szolgaltatoAdoszam}}</td></tr>
  <tr><td><strong>Cégjegyzékszám:</strong></td><td>{{szolgaltatoCegjegyzek}}</td></tr>
  <tr><td><strong>Email:</strong></td><td>{{szolgaltatoEmail}}</td></tr>
  <tr><td><strong>Telefon:</strong></td><td>{{szolgaltatoTelefon}}</td></tr>
  <tr><td><strong>Weboldal:</strong></td><td>{{weboldalUrl}}</td></tr>
</table>

<h2>2. Az ÁSZF hatálya</h2>
<p>Jelen ÁSZF hatálya kiterjed a {{weboldalUrl}} weboldalon nyújtott szolgáltatásokra és a Szolgáltató és a Felhasználók (vásárlók, megrendelők) közötti jogviszonyra.</p>
<p>A Felhasználó a szolgáltatás igénybevételével, illetve a megrendelés leadásával elfogadja jelen ÁSZF rendelkezéseit.</p>

<h2>3. A szolgáltatás leírása</h2>
<p>{{tevekenysegiKor}}</p>

<h2>4. Megrendelés folyamata</h2>
<ol>
  <li>A Felhasználó a weboldalon kiválasztja a kívánt terméket/szolgáltatást.</li>
  <li>A kosár tartalmát ellenőrzi és jóváhagyja.</li>
  <li>Megadja a számlázási és szállítási adatait.</li>
  <li>Kiválasztja a fizetési módot.</li>
  <li>A megrendelést véglegesíti.</li>
  <li>A Szolgáltató visszaigazoló emailt küld 48 órán belül.</li>
</ol>
<p>A megrendelés a Szolgáltató visszaigazolásával jön létre mint szerződés.</p>

<h2>5. Árak és fizetés</h2>
<p>A weboldalon feltüntetett árak bruttó árak (az ÁFA-t tartalmazzák), hacsak másként nem jelöltük.</p>
<p><strong>Elfogadott fizetési módok:</strong> {{fizetesiModok}}</p>
<p>A Szolgáltató fenntartja az árak módosításának jogát. A már leadott megrendelésekre az áremelés nem vonatkozik.</p>

<h2>6. Szállítás</h2>
<p>A szállítási idő a megrendelés visszaigazolásától számított <strong>{{szallitasiIdo}}</strong> munkanap.</p>
<p>A szállítási költséget a megrendelés összesítőjében tüntetjük fel. A Szolgáltató a szállítás késedelméért nem felel, ha az vis maior vagy a futárszolgálat hibájából ered.</p>

<h2>7. Elállási jog</h2>
<p>A fogyasztónak minősülő Felhasználó a termék kézhezvételétől (szolgáltatás esetén a szerződés megkötésétől) számított <strong>{{elallasHatarido}}</strong> napon belül indokolás nélkül elállhat a szerződéstől.</p>
<p>Az elállási jog gyakorlásának módja: írásbeli nyilatkozat a {{szolgaltatoEmail}} email címre.</p>
<p>Elállás esetén a Szolgáltató a vételárat legkésőbb 14 napon belül visszafizeti.</p>

<h2>8. Szavatosság és jótállás</h2>
<p>A Szolgáltató szavatolja, hogy a termékek/szolgáltatások megfelelnek a leírásnak. Hibás teljesítés esetén a fogyasztó a Ptk. szerint szavatossági igényt érvényesíthet (javítás, csere, árleszállítás, elállás).</p>

<h2>9. Panaszkezelés</h2>
<p>A Felhasználó panaszát a {{szolgaltatoEmail}} email címen vagy a {{szolgaltatoTelefon}} telefonszámon jelezheti. A Szolgáltató a panaszra 30 napon belül írásban válaszol.</p>
<p>Vitás esetben a Felhasználó a lakóhelye szerinti békéltető testülethez fordulhat, vagy az online vitarendezési platformot használhatja.</p>

<h2>10. Adatkezelés</h2>
<p>A Szolgáltató a Felhasználók személyes adatait az Adatkezelési Tájékoztatóban foglaltak szerint, a GDPR és az Infotv. rendelkezéseinek megfelelően kezeli.</p>

<h2>11. Szellemi tulajdon</h2>
<p>A weboldal teljes tartalma (szövegek, képek, grafika, logó, szoftver) a Szolgáltató szellemi tulajdonát képezi, azok engedély nélküli felhasználása tilos.</p>

<h2>12. Záró rendelkezések</h2>
<p>A jelen ÁSZF-ben nem szabályozott kérdésekben a Ptk., az Eker. tv. és a fogyasztóvédelmi jogszabályok rendelkezései irányadók.</p>
<p>A Szolgáltató jogosult jelen ÁSZF-et egyoldalúan módosítani. A módosított ÁSZF a weboldalon való közzététellel lép hatályba.</p>
`,
  },
  {
    name: 'Adatkezelési tájékoztató (GDPR)',
    category: 'adatvedelem',
    description: 'GDPR-kompatibilis adatkezelési tájékoztató.',
    legalBasis: 'GDPR (EU 2016/679), Infotv. (2011. évi CXII. tv.)',
    variables: [
      { name: 'adatkezeloNeve', label: 'Adatkezelő neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'adatkezeloCime', label: 'Adatkezelő székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'adatkezeloAdoszam', label: 'Adatkezelő adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'adatkezeloEmail', label: 'Adatvédelmi email cím', type: 'text', required: true, filledBy: 'creator' },
      { name: 'adatkezeloTelefon', label: 'Adatkezelő telefonszáma', type: 'text', required: false, filledBy: 'creator' },
      { name: 'weboldalUrl', label: 'Weboldal URL', type: 'text', required: true, filledBy: 'creator' },
      { name: 'adatfeldolgozok', label: 'Adatfeldolgozók listája', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'cookieLeiras', label: 'Cookie-k leírása', type: 'textarea', required: false, filledBy: 'creator' },
      { name: 'adatTarolasIdeje', label: 'Adatok tárolási ideje', type: 'text', required: true, filledBy: 'creator' },
      { name: 'hatalybaLepes', label: 'Hatályba lépés', type: 'date', required: true, filledBy: 'creator' },
    ],
    contentHtml: `
<h1>ADATKEZELÉSI TÁJÉKOZTATÓ</h1>
<p><em>Hatályos: {{hatalybaLepes}} napjától</em></p>

<h2>1. Az Adatkezelő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{adatkezeloNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{adatkezeloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{adatkezeloAdoszam}}</td></tr>
  <tr><td><strong>Email:</strong></td><td>{{adatkezeloEmail}}</td></tr>
  <tr><td><strong>Telefon:</strong></td><td>{{adatkezeloTelefon}}</td></tr>
</table>

<h2>2. A tájékoztató célja</h2>
<p>Jelen tájékoztató célja, hogy a {{weboldalUrl}} weboldal felhasználói és ügyfelei számára átlátható módon bemutassa, hogyan kezeljük személyes adataikat az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR), valamint az információs önrendelkezési jogról szóló 2011. évi CXII. törvény (Infotv.) alapján.</p>

<h2>3. Kezelt személyes adatok köre</h2>
<table>
  <tr><th>Adatkategória</th><th>Jogalap</th><th>Cél</th></tr>
  <tr><td>Név, email cím</td><td>Szerződés teljesítése (GDPR 6(1)(b))</td><td>Felhasználói fiók kezelése, kapcsolattartás</td></tr>
  <tr><td>Számlázási adatok (név, cím, adószám)</td><td>Jogi kötelezettség (GDPR 6(1)(c))</td><td>Számla kiállítása, adóügyi megfelelés</td></tr>
  <tr><td>IP cím, böngésző adatok</td><td>Jogos érdek (GDPR 6(1)(f))</td><td>Biztonság, visszaélés-megelőzés</td></tr>
  <tr><td>Cookie-k, használati adatok</td><td>Hozzájárulás (GDPR 6(1)(a))</td><td>Weboldal működtetése, elemzés</td></tr>
</table>

<h2>4. Adatok tárolásának ideje</h2>
<p>{{adatTarolasIdeje}}</p>
<p>A számlázási adatokat a számviteli törvény szerint 8 évig őrizzük meg.</p>

<h2>5. Adatfeldolgozók</h2>
<p>Az Adatkezelő az alábbi adatfeldolgozókat veszi igénybe:</p>
<p>{{adatfeldolgozok}}</p>

<h2>6. Az érintett jogai</h2>
<p>A GDPR alapján Ön az alábbi jogokkal rendelkezik:</p>
<ul>
  <li><strong>Hozzáférés joga:</strong> Tájékoztatást kérhet az Önről kezelt adatokról.</li>
  <li><strong>Helyesbítés joga:</strong> Kérheti pontatlan adatai kijavítását.</li>
  <li><strong>Törlés joga ("elfeledtetés"):</strong> Kérheti adatai törlését, ha az adatkezelés célja megszűnt.</li>
  <li><strong>Adatkezelés korlátozása:</strong> Kérheti az adatkezelés felfüggesztését.</li>
  <li><strong>Adathordozhatóság:</strong> Kérheti adatai géppel olvasható formátumban történő kiadását.</li>
  <li><strong>Tiltakozás:</strong> Tiltakozhat a jogos érdeken alapuló adatkezelés ellen.</li>
  <li><strong>Hozzájárulás visszavonása:</strong> A hozzájáruláson alapuló adatkezelésre adott engedélyt bármikor visszavonhatja.</li>
</ul>
<p>Jogai gyakorlásához kérjük, írjon a {{adatkezeloEmail}} email címre.</p>

<h2>7. Cookie-k (sütik)</h2>
<p>{{cookieLeiras}}</p>

<h2>8. Adatbiztonság</h2>
<p>Az Adatkezelő megfelelő technikai és szervezési intézkedéseket alkalmaz a személyes adatok védelme érdekében, beleértve a titkosítást, tűzfalakat, hozzáférés-korlátozást és rendszeres biztonsági mentéseket.</p>

<h2>9. Adattovábbítás harmadik országba</h2>
<p>Az Adatkezelő nem továbbít személyes adatokat az Európai Gazdasági Térségen (EGT) kívülre, kivéve ha az adatfeldolgozó megfelelő garanciákat (pl. Standard Contractual Clauses) biztosít.</p>

<h2>10. Jogorvoslat</h2>
<p>Adatkezelési kérdéssel, panasszal forduljon hozzánk: {{adatkezeloEmail}}</p>
<p>Ha nem elégedett válaszunkkal, panaszt nyújthat be a Nemzeti Adatvédelmi és Információszabadság Hatósághoz (NAIH):</p>
<ul>
  <li>Cím: 1055 Budapest, Falk Miksa utca 9-11.</li>
  <li>Telefon: +36 (1) 391-1400</li>
  <li>Web: www.naih.hu</li>
</ul>
`,
  },
  {
    name: 'Kölcsönszerződés (magánszemélyek)',
    category: 'penzugyi',
    description: 'Kölcsönszerződés magánszemélyek közötti pénzkölcsönzésre.',
    legalBasis: 'Ptk. 6:383-6:392. §',
    variables: [
      { name: 'kolcsonadoNeve', label: 'Kölcsönadó neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'kolcsonadoSzemelyiIg', label: 'Kölcsönadó személyi ig. száma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'kolcsonadoLakcime', label: 'Kölcsönadó lakcíme', type: 'text', required: true, filledBy: 'creator' },
      { name: 'kolcsonvevoNeve', label: 'Kölcsönvevő neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'kolcsonvevoSzemelyiIg', label: 'Kölcsönvevő személyi ig. száma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'kolcsonvevoLakcime', label: 'Kölcsönvevő lakcíme', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'kolcsonOsszeg', label: 'Kölcsön összege (Ft)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'kamatMertek', label: 'Kamat mértéke (%/év)', type: 'text', required: true, filledBy: 'creator' },
      { name: 'visszafizetesiHatarido', label: 'Visszafizetési határidő', type: 'date', required: true, filledBy: 'creator' },
      { name: 'torlesztesModja', label: 'Törlesztés módja', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
    ],
    contentHtml: `
<h1>KÖLCSÖNSZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Kölcsönadó</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{kolcsonadoNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{kolcsonadoSzemelyiIg}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{kolcsonadoLakcime}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Kölcsönadó</strong>), másrészről</p>

<h2>2. Kölcsönvevő</h2>
<table>
  <tr><td><strong>Név:</strong></td><td>{{kolcsonvevoNeve}}</td></tr>
  <tr><td><strong>Személyi ig. szám:</strong></td><td>{{kolcsonvevoSzemelyiIg}}</td></tr>
  <tr><td><strong>Lakcím:</strong></td><td>{{kolcsonvevoLakcime}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Kölcsönvevő</strong>) között az alábbi feltételekkel:</p>

<h2>3. A kölcsön összege</h2>
<p>A Kölcsönadó kölcsönad a Kölcsönvevőnek <strong>{{kolcsonOsszeg}}</strong> Ft, azaz ... forint összeget.</p>
<p>A kölcsön összegét a Kölcsönadó jelen szerződés aláírásával egyidejűleg készpénzben átadja / a Kölcsönvevő bankszámlájára átutalja.</p>

<h2>4. Kamat</h2>
<p>A kölcsön éves kamata: <strong>{{kamatMertek}}</strong>.</p>
<p>A kamat a kölcsön folyósításának napjától a visszafizetés napjáig számítandó.</p>

<h2>5. Visszafizetés</h2>
<p>A Kölcsönvevő a kölcsön összegét és járulékait legkésőbb <strong>{{visszafizetesiHatarido}}</strong> napjáig köteles visszafizetni.</p>
<p>A törlesztés módja: <strong>{{torlesztesModja}}</strong></p>

<h2>6. Késedelem</h2>
<p>Késedelmes fizetés esetén a Kölcsönvevő a Ptk. szerinti késedelmi kamatot köteles fizetni (a jegybanki alapkamat + 8 százalékpont).</p>

<h2>7. Előtörlesztés</h2>
<p>A Kölcsönvevő jogosult a kölcsönt részben vagy egészben előtörleszteni. Előtörlesztés esetén a kamat csak a tényleges kölcsönhasználat idejére jár.</p>

<h2>8. Felmondás</h2>
<p>A Kölcsönadó azonnali hatállyal felmondhatja a kölcsönt, ha:</p>
<ul>
  <li>A Kölcsönvevő a törlesztő részlettel 30 napot meghaladó késedelembe esik;</li>
  <li>A Kölcsönvevő vagyoni helyzete lényegesen romlik;</li>
  <li>A Kölcsönvevő a szerződés lényeges feltételeit megszegi.</li>
</ul>

<h2>9. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Ptk. kölcsönszerződésre vonatkozó rendelkezései irányadók.</p>
<p>Jelen szerződés 2 eredeti példányban készült, amelyből 1-1 a Feleket illeti.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Szállítási szerződés',
    category: 'b2b',
    description: 'Szállítási keretszerződés rendszeres áruszállításra.',
    legalBasis: 'Ptk. 6:258-6:260. §',
    variables: [
      { name: 'szallitoNeve', label: 'Szállító neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szallitoCime', label: 'Szállító székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szallitoAdoszam', label: 'Szállító adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'megrendeloNeve', label: 'Megrendelő neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloCime', label: 'Megrendelő székhelye', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'szallitandoAru', label: 'Szállítandó áru megnevezése', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'szallitasiUtemezés', label: 'Szállítási ütemezés', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szallitasiHely', label: 'Szállítás helye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'arMeghatározas', label: 'Ár meghatározás módja', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'fizetesiHatarido', label: 'Fizetési határidő (nap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'szerzodesIdotartama', label: 'Szerződés időtartama', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
    ],
    contentHtml: `
<h1>SZÁLLÍTÁSI KERETSZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Szállító</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{szallitoNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{szallitoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{szallitoAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Szállító</strong>), másrészről</p>

<h2>2. Megrendelő</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{megrendeloNeve}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{megrendeloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megrendeloAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megrendelő</strong>) között az alábbi feltételekkel:</p>

<h2>3. A szerződés tárgya</h2>
<p>A Szállító vállalja az alábbi áruk rendszeres szállítását a Megrendelő részére:</p>
<p>{{szallitandoAru}}</p>

<h2>4. Szállítási feltételek</h2>
<p><strong>Szállítási ütemezés:</strong> {{szallitasiUtemezés}}</p>
<p><strong>Szállítás helye:</strong> {{szallitasiHely}}</p>
<p>A Szállító az árut a szállítás helyén a Megrendelőnek vagy meghatalmazottjának adja át. Az áru átvételét a Megrendelő szállítólevél aláírásával igazolja.</p>

<h2>5. Árak és fizetés</h2>
<p>{{arMeghatározas}}</p>
<p>Fizetési határidő: számla kézhezvételétől számított <strong>{{fizetesiHatarido}}</strong> nap, átutalással.</p>

<h2>6. Minőség és mennyiség</h2>
<p>A Szállító szavatolja, hogy az áruk a vonatkozó szabványoknak és a szerződésben foglalt minőségi követelményeknek megfelelnek.</p>
<p>Mennyiségi és minőségi kifogásait a Megrendelő az átvételt követő 3 munkanapon belül köteles jelezni.</p>

<h2>7. Szerződés időtartama</h2>
<p>Jelen szerződés {{szerzodesIdotartama}} időtartamra jön létre. A szerződés bármelyik fél által 60 napos felmondási idővel felmondható.</p>

<h2>8. Kötbér</h2>
<p>Késedelmes szállítás esetén a Szállító a késedelmes tétel értékének napi 0,5%-ának megfelelő kötbért köteles fizetni, legfeljebb az adott tétel értékének 15%-áig.</p>

<h2>9. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Ptk. rendelkezései irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
  {
    name: 'Szoftverfejlesztési szerződés',
    category: 'it',
    description: 'IT/szoftverfejlesztési szerződés egyedi szoftver készítésére.',
    legalBasis: 'Ptk. 6:238-6:250. § (vállalkozás), Szjt. (1999. évi LXXVI. tv.)',
    variables: [
      { name: 'megrendeloCeg', label: 'Megrendelő cég neve', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloCime', label: 'Megrendelő székhelye', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'megrendeloAdoszam', label: 'Megrendelő adószáma', type: 'text', required: true, filledBy: 'signer', signerIndex: 0 },
      { name: 'fejlesztoCeg', label: 'Fejlesztő cég neve', type: 'text', required: true, filledBy: 'creator' },
      { name: 'fejlesztoCime', label: 'Fejlesztő székhelye', type: 'text', required: true, filledBy: 'creator' },
      { name: 'fejlesztoAdoszam', label: 'Fejlesztő adószáma', type: 'text', required: true, filledBy: 'creator' },
      { name: 'projektLeirasa', label: 'Projekt leírása', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'technologiakLista', label: 'Felhasznált technológiák', type: 'text', required: false, filledBy: 'creator' },
      { name: 'merfoldkovek', label: 'Mérföldkövek és határidők', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'vegsoHatarido', label: 'Végső átadási határidő', type: 'date', required: true, filledBy: 'creator' },
      { name: 'teljesDij', label: 'Teljes fejlesztési díj (Ft + ÁFA)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'fizetesiUtemezés', label: 'Fizetési ütemezés', type: 'textarea', required: true, filledBy: 'creator' },
      { name: 'garancialisIdo', label: 'Garanciális hibajavítás ideje (hónap)', type: 'number', required: true, filledBy: 'creator' },
      { name: 'forrasKodAtadas', label: 'Forráskód átadása', type: 'text', required: true, filledBy: 'creator' },
      { name: 'szerzodesKelte', label: 'Szerződés kelte', type: 'date', required: true, filledBy: 'creator' },
    ],
    contentHtml: `
<h1>SZOFTVERFEJLESZTÉSI SZERZŐDÉS</h1>
<p>amely létrejött egyrészről</p>

<h2>1. Megrendelő</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{megrendeloCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{megrendeloCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{megrendeloAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Megrendelő</strong>), másrészről</p>

<h2>2. Fejlesztő</h2>
<table>
  <tr><td><strong>Cégnév:</strong></td><td>{{fejlesztoCeg}}</td></tr>
  <tr><td><strong>Székhely:</strong></td><td>{{fejlesztoCime}}</td></tr>
  <tr><td><strong>Adószám:</strong></td><td>{{fejlesztoAdoszam}}</td></tr>
</table>
<p>(a továbbiakban: <strong>Fejlesztő</strong>) között az alábbi feltételekkel:</p>

<h2>3. A fejlesztés tárgya</h2>
<p>{{projektLeirasa}}</p>
<p>Felhasznált technológiák: {{technologiakLista}}</p>

<h2>4. Mérföldkövek és határidők</h2>
<p>{{merfoldkovek}}</p>
<p><strong>Végső átadási határidő:</strong> {{vegsoHatarido}}</p>

<h2>5. Fejlesztési díj és fizetés</h2>
<p>A teljes fejlesztési díj: <strong>{{teljesDij}}</strong> Ft + ÁFA.</p>
<p><strong>Fizetési ütemezés:</strong></p>
<p>{{fizetesiUtemezés}}</p>

<h2>6. Fejlesztési folyamat</h2>
<p>A Fejlesztő agilis módszertan szerint dolgozik. Kéthetente demo-t tart a Megrendelőnek. A Megrendelő 5 munkanapon belül visszajelzést ad.</p>
<p>A specifikáció módosítása írásban történik. Lényeges módosítás esetén a Fejlesztő módosított ajánlatot ad, amely a határidőre és az árra is kihathat.</p>

<h2>7. Átadás-átvétel</h2>
<p>Az átadás-átvétel a végső mérföldkő teljesítését követően történik. A Megrendelő 10 munkanapon belül tesztet végez és jelzi az észlelt hibákat. A Fejlesztő a hibákat 10 munkanapon belül javítja.</p>
<p>Sikeres tesztelés után a Megrendelő átvételi jegyzőkönyvet ír alá.</p>

<h2>8. Szellemi tulajdon</h2>
<p>A teljes fejlesztési díj megfizetését követően a szoftver vagyoni felhasználási jogai a Megrendelőre szállnak át.</p>
<p>Forráskód átadása: <strong>{{forrasKodAtadas}}</strong></p>
<p>A Fejlesztő által használt nyílt forráskódú komponensek az eredeti licencük hatálya alatt maradnak.</p>

<h2>9. Garancia és support</h2>
<p>A Fejlesztő az átadástól számított <strong>{{garancialisIdo}}</strong> hónapig garanciális hibajavítást vállal díjmentesen.</p>
<p>Kritikus hiba esetén a reagálási idő: 4 óra (munkanapokon). Nem kritikus hiba esetén: 2 munkanap.</p>

<h2>10. Titoktartás</h2>
<p>Mindkét fél köteles a másik fél üzleti titkait, technológiai megoldásait bizalmasan kezelni. Ez a kötelezettség a szerződés megszűnését követő 3 évig fennáll.</p>

<h2>11. Felelősség korlátozása</h2>
<p>A Fejlesztő felelőssége a fejlesztési díj összegéig terjed. A Fejlesztő nem felel a szoftver nem rendeltetésszerű használatából eredő károkért.</p>

<h2>12. Záró rendelkezések</h2>
<p>A jelen szerződésben nem szabályozott kérdésekben a Ptk. és a szerzői jogi törvény rendelkezései irányadók.</p>

<p style="margin-top:40px;">Kelt: ............, {{szerzodesKelte}}</p>
`,
  },
];

const defaultClauses = [
  {
    title: 'Titoktartási záradék',
    category: 'titoktartás',
    tags: ['NDA', 'bizalmas', 'titoktartás'],
    content: `<h3>Titoktartási kötelezettség</h3>
<p>A Felek kötelezettséget vállalnak arra, hogy a jelen szerződés teljesítése során tudomásukra jutott üzleti titkokat, bizalmas információkat harmadik személyek számára nem teszik hozzáférhetővé, azokat kizárólag a szerződés teljesítéséhez szükséges mértékben használják fel.</p>
<p>A titoktartási kötelezettség a szerződés megszűnését követően további 5 (öt) évig fennáll.</p>
<p>A titoktartási kötelezettség megsértése esetén a vétkes fél köteles a másik félnek okozott kárt megtéríteni.</p>`,
  },
  {
    title: 'Vis major záradék',
    category: 'vis major',
    tags: ['vis major', 'force majeure', 'mentesülés'],
    content: `<h3>Vis major</h3>
<p>Egyik fél sem felel a szerződésben foglalt kötelezettség teljesítéséért azon esetekben, amikor a felek érdekkörén kívül eső, előre nem látható körülmények (vis major) merülnek fel, ideértve különösen: természeti katasztrófákat, háborút, járványt, sztrájkot, hatósági intézkedéseket.</p>
<p>A vis major eseményt az érintett fél köteles a másik félnek haladéktalanul, de legkésőbb 5 munkanapon belül írásban bejelenteni. A vis major időtartamára a teljesítési határidők meghosszabbodnak.</p>`,
  },
  {
    title: 'Kötbér záradék',
    category: 'kötbér',
    tags: ['kötbér', 'szankció', 'késedelem'],
    content: `<h3>Kötbér</h3>
<p>Amennyiben bármelyik Fél a jelen szerződésben foglalt lényeges kötelezettségét megszegi, a másik Fél kötbér megfizetését követelheti.</p>
<p><strong>Késedelmi kötbér:</strong> A késedelmesen teljesítő Fél a késedelem minden megkezdett napjára a szerződéses érték 0,5%-ának, de összesen legfeljebb 20%-ának megfelelő kötbért köteles fizetni.</p>
<p><strong>Meghiúsulási kötbér:</strong> Ha a szerződés a kötelezett hibájából meghiúsul, a jogosult fél a szerződéses érték 30%-ának megfelelő meghiúsulási kötbér megfizetését követelheti.</p>
<p>A kötbér megfizetése nem mentesít a kötbért meghaladó kár megtérítése alól.</p>`,
  },
  {
    title: 'Szavatossági záradék',
    category: 'szavatosság',
    tags: ['szavatosság', 'garancia', 'jótállás'],
    content: `<h3>Szavatosság és jótállás</h3>
<p>A Szolgáltató/Eladó szavatol azért, hogy a szolgáltatás/termék a teljesítés időpontjában megfelel a szerződésben meghatározott tulajdonságoknak, valamint a jogszabályban meghatározott minőségi követelményeknek.</p>
<p>A szavatossági igény érvényesítésére a Ptk. 6:163-6:167. §-ai irányadóak. A szavatossági jog érvényesítésének határideje a teljesítéstől számított 1 (egy) év.</p>
<p>A Felek megállapodnak, hogy a szavatossági kötelezettség teljesítése keretében a Szolgáltató/Eladó elsősorban kijavítással vagy kicseréléssel orvosolja a hibát.</p>`,
  },
  {
    title: 'Felelősségkorlátozás',
    category: 'felelősség',
    tags: ['felelősség', 'korlátozás', 'kártérítés'],
    content: `<h3>Felelősségkorlátozás</h3>
<p>A Felek megállapodnak, hogy a jelen szerződés teljesítése során okozott károkért való felelősségük mértéke nem haladhatja meg a szerződés szerinti éves díj összegét, kivéve a szándékosan vagy súlyos gondatlansággal okozott károkat.</p>
<p>Egyik Fél sem felel a másik Fél közvetett vagy következményes káraiért, ideértve különösen az elmaradt hasznot, az adatvesztésből eredő károkat és a harmadik felek igényeit.</p>
<p>A felelősségkorlátozás nem vonatkozik a személyi sérülésből eredő károkra.</p>`,
  },
  {
    title: 'GDPR adatkezelési záradék',
    category: 'GDPR',
    tags: ['GDPR', 'adatvédelem', 'személyes adat'],
    content: `<h3>Adatkezelési rendelkezések</h3>
<p>A Felek kötelezettséget vállalnak arra, hogy a jelen szerződés teljesítése során a személyes adatokat az Európai Parlament és a Tanács (EU) 2016/679 rendeletének (GDPR), valamint az információs önrendelkezési jogról szóló 2011. évi CXII. törvény rendelkezéseinek megfelelően kezelik.</p>
<p>A személyes adatok kezelésének jogalapja a szerződés teljesítése (GDPR 6. cikk (1) bek. b) pont). Az adatkezelés időtartama a szerződés hatálya alatt és a szerződéses igények elévüléséig tart.</p>
<p>Az adatkezelő köteles megfelelő technikai és szervezési intézkedéseket tenni a személyes adatok védelme érdekében. Adatvédelmi incidens esetén az adatkezelő köteles a NAIH-t és az érintetteket a jogszabályban meghatározott határidőn belül értesíteni.</p>`,
  },
  {
    title: 'Fizetési feltételek',
    category: 'fizetés',
    tags: ['fizetés', 'díj', 'számla', 'határidő'],
    content: `<h3>Fizetési feltételek</h3>
<p>A Megrendelő a szolgáltatás ellenértékét a Szolgáltató által kiállított számla alapján, a számla kézhezvételétől számított 15 (tizenöt) napon belül köteles megfizetni átutalással a Szolgáltató számlán megjelölt bankszámlájára.</p>
<p>Késedelmes fizetés esetén a Megrendelő a Ptk. 6:155. § szerinti késedelmi kamatot köteles fizetni. A késedelmi kamat mértéke a jegybanki alapkamat nyolc százalékponttal növelt értéke.</p>
<p>A Szolgáltató jogosult a szolgáltatás teljesítését felfüggeszteni, amennyiben a Megrendelő fizetési késedelme meghaladja a 30 napot.</p>`,
  },
  {
    title: 'Szellemi tulajdon záradék',
    category: 'szellemi tulajdon',
    tags: ['szellemi tulajdon', 'szerzői jog', 'licenc'],
    content: `<h3>Szellemi tulajdonjogok</h3>
<p>A jelen szerződés teljesítése során létrejött szellemi alkotások (szoftver, dokumentáció, design, know-how) szerzői joga a Szolgáltatót/létrehozót illeti meg, kivéve ha a felek írásban másként állapodnak meg.</p>
<p>A Megrendelő nem kizárólagos, nem átruházható, időben korlátlan felhasználási jogot szerez a szerződés teljesítése során átadott szellemi alkotások tekintetében, a szerződésben meghatározott célra.</p>
<p>A Felek kötelesek tartózkodni a másik fél szellemi tulajdonjogainak megsértésétől. A szellemi tulajdonjogok megsértéséből eredő károkért a jogsértő fél teljes körű felelősséggel tartozik.</p>`,
  },
  {
    title: 'Felmondási záradék',
    category: 'felmondás',
    tags: ['felmondás', 'megszüntetés', 'határidő'],
    content: `<h3>A szerződés felmondása</h3>
<p><strong>Rendes felmondás:</strong> A határozatlan idejű szerződést bármelyik Fél jogosult 30 (harminc) napos felmondási idővel, írásban felmondani. A felmondási idő a felmondás kézbesítését követő napon kezdődik.</p>
<p><strong>Rendkívüli felmondás:</strong> Bármelyik Fél jogosult a szerződést azonnali hatállyal felmondani, ha a másik Fél a szerződésben foglalt lényeges kötelezettségét súlyosan megszegi, és azt írásbeli felszólítás ellenére 15 napon belül nem orvosolja.</p>
<p>A szerződés megszűnése nem érinti a felek azon jogait és kötelezettségeit, amelyek természetüknél fogva a szerződés megszűnését követően is fennmaradnak (titoktartás, elszámolás, szellemi tulajdon).</p>`,
  },
  {
    title: 'Jogvita rendezése',
    category: 'jogvita',
    tags: ['jogvita', 'bíróság', 'egyeztetés', 'választottbíróság'],
    content: `<h3>Jogviták rendezése</h3>
<p>A Felek megállapodnak, hogy a jelen szerződésből eredő vagy azzal kapcsolatos jogvitáikat elsősorban békés úton, közvetlen tárgyalás útján kísérlik meg rendezni.</p>
<p>Amennyiben a közvetlen tárgyalás a vita felmerülésétől számított 30 napon belül nem vezet eredményre, a Felek alávetik magukat a Szolgáltató székhelye szerint illetékes bíróság kizárólagos illetékességének.</p>
<p>A jelen szerződésre a magyar jog az irányadó, ideértve különösen a Polgári Törvénykönyvről szóló 2013. évi V. törvény rendelkezéseit.</p>`,
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

  // Seed default clauses
  for (const c of defaultClauses) {
    const existing = await prisma.clause.findFirst({
      where: { title: c.title, isDefault: true },
    });
    if (!existing) {
      await prisma.clause.create({
        data: {
          title: c.title,
          content: c.content,
          category: c.category,
          tags: c.tags,
          userId: 'system', // system-owned default clauses
          isDefault: true,
        },
      });
      console.log(`Created default clause: ${c.title}`);
    } else {
      console.log(`Default clause already exists: ${c.title}`);
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

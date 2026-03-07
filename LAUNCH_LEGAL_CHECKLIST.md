# SzerzodesPortal - Kereskedelmi Indulas Jogi/Penzugyi/Kockazati Ellenorzolista

**Keszult:** 2026. marcius 7.
**Platform:** szerzodes.cegverzum.hu - Online szerzodeskozelo SaaS platform
**Cel:** Teljes koruen osszegyujteni a kereskedelmi indulashoz szukseges jogi, penzugyi es uzleti kovetelmenyeket

---

## TARTALOMJEGYZEK

1. [Elektronikus alairas jogi ervenyessege](#1-elektronikus-alairas-jogi-ervenyessege)
2. [GDPR / Adatvedelem](#2-gdpr--adatvedelem)
3. [Cegforma es adozas](#3-cegforma-es-adozas)
4. [ASZF es jogi dokumentumok](#4-aszf-es-jogi-dokumentumok)
5. [Biztositas es felelosseg](#5-biztositas-es-felelosseg)
6. [Fizetesi rendszer](#6-fizetesi-rendszer)
7. [Magyar jogszabalyi hivatkozasok](#7-magyar-jogszabalyi-hivatkozasok)
8. [Osszesitett checklist](#8-osszesitett-checklist)

---

## 1. ELEKTRONIKUS ALAIRAS JOGI ERVENYESSEGE

### Hatter: eIDAS es magyar szabalyozas

Az EU eIDAS rendelete (910/2014) kozvetlenul alkalmazando Magyarorszagon. Harom szintu elektronikus alairast kulonboztet meg:

| Tipus | Leiras | Jogi hatas |
|-------|---------|------------|
| **Egyszeru elektronikus alairas (SES)** | Barmi, ami elektronikusan azonositja az alairot (pl. kepernyon rajzolt alairas, begepelt nev) | NEM minosul automatikusan irasbelinek. Bírosag egyedileg merlegel. |
| **Fokozott biztonsagu alairas (AES)** | Egyedien az alairohoz kotheto, alkalmas azonositasra, utolaget valtozas eszlelheto | A 2023. evi XLVI. torveny szerint irasbelinek minosul. |
| **Minositett elektronikus alairas (QES)** | Minositett bizalmi szolgaltato altal kibocsatott tanusitvannyal, minositett eszkozzel | Teljes mertekben egyenertek a kezirassal. EU-szerte kotelezoen elfogadando. |

### A SzerzodesPortal jelenlegi helyzete

A platform jelenleg **egyszeru elektronikus alairast (SES)** hasznal:
- Kepernyon rajzolt kezirashoz hasonlo alairas (signature_pad)
- Begepelt nev (serif italic betutipussal a PDF-ben)
- QR kod verifikacio a PDF-en

### Jogi ertekeles

**FONTOS:** Az egyszeru elektronikus alairas onmagaban NEM minosul irasbelinek a Ptk. 6:7.ss alapjan. Azonban:

- A Ptk. technologia-semleges megkozelitest alkalmaz
- Birosagi gyakorlat: egyedileg merlegel, hogy az adott elektronikus forma megfelel-e az irásbeliseg kovetelmenyeinek
- A 2023. evi XLVI. torveny egyertelmuen kimondja, hogy legalabb **fokozott biztonsagu (AES)** alairas + idopecszt szukseges ahhoz, hogy az elektronikus magankirat irasbelinek minlosuljon

### Teendok es prioritasok

| Teendo | Statusz | Prioritas | Becsult koltseg |
|--------|---------|-----------|-----------------|
| **Figyelmeztetes a felhasznaloknak**, hogy az egyszeru e-alairas NEM egyenertek a kezirassal, es NEM minden jogviszonyban fogadjak el | **KOTELEZO** | Indulas elott | 0 Ft (szovegmodositas) |
| **DAP eAlairas integracio** - 2025-tol elerheto, ingyenes, QES szintu | AJANLOTT | Indulas utan 3-6 honapon belul | Fejlesztesi koltseg |
| **Microsec vagy NetLock integracio** - piaci minositett bizalmi szolgaltato REST API-val | AJANLOTT | Keso fazis (premium feature) | 500.000-2.000.000 Ft/ev licensz + fejlesztes |
| **Audit trail / bizonyitasi csomag** - idopecset, IP cim, bongeszo adatok, hash rogzitese minden alairasnal | **KOTELEZO** | Indulas elott | 0 Ft (fejlesztes) |

### Melyik szerzodestipusoknal elegendo az egyszeru e-alairas?

- **Altalanos uzleti megallapodasok (B2B):** Igen, ha mindket fel elfogadja (szerzodesi szabadsag)
- **Munkajogi szerzodescek:** Korlátozott - egyes jognyilatkozatokhoz irásbeliség kell
- **Ingatlan adavsvetel:** NEM - kotelezoen ugyved/kozjegyzo szukseges
- **Hitelszerzodescek, kezesseg:** NEM - fokozott/minositett alairas kell

**Ajánlás:** A platform egyertelmuen kozölje minden sablonnal, hogy az adott szerzodestipushoz milyen alairasi szint szukseges, es ajánljon minositett alairast ahol az jogszabalyi kovetelmeny.

---

## 2. GDPR / ADATVEDELEM

### 2.1 Adatkezelesi kotelezetsegek

| Teendo | Statusz | Prioritas | Becsult koltseg |
|--------|---------|-----------|-----------------|
| **Adatkezelesi Tajekoztato (Privacy Policy)** | **KOTELEZO** | Indulas elott | 50.000-150.000 Ft (ugyvedi) |
| **Cookie tajekoztato + hozzajarulas kezeles** | **KOTELEZO** | Indulas elott | 0-30.000 Ft |
| **Adatkezelesi nyilvantartas (ROPA)** | **KOTELEZO** | Indulas elott | 0 Ft (belso dokumentum) |
| **Adatvedelmi hatasvizsgalat (DPIA)** | **KOTELEZO** | Indulas elott | 100.000-300.000 Ft |

### 2.2 Adatvedelmi tisztviselo (DPO)

A GDPR 37. cikke szerint DPO kinevezese **kotelező**, ha:
- Kozfeladadat ellato szerv az adatkezelo
- Fo tevekenyseg: nagymerteku, rendszeres, szisztematikus megfigyeles
- Kulonleges adatok nagymerteku kezelese

**A SzerzodresPortal eseteben:** Varhatoan NEM kotelezo, de **erosen ajanlott**, kulonosen ha nagyszamu szerzodes es szemelyes adat kezelese tortenik. Kulso DPO szolgaltatas: havi 30.000-80.000 Ft.

### 2.3 NAIH nyilvantartas

A GDPR bevezettesevel a korabbi NAIH nyilvantartasba veteli kotelezettseg **megszunt**. Azonban:
- Incidens eseten 72 oran belul **NAIH-nak bejelentes** kotelezo
- Az erintettek panaszt nyujthatnak be a NAIH-hoz
- Adatvedelmi incidens nyilvantartast vezetni kell belsokent

### 2.4 Adatfeldolgozo szerzodes (DPA)

**KOTELEZO** adatfeldolgozoi szerzodest kotni minden partnerrel aki szemelyes adatot kezel:

| Partner | Tipus | Teendo |
|---------|-------|--------|
| **Cloudflare R2** (tarolás) | Adatfeldolgozo | Cloudflare DPA elfogadasa + SCC (Standard Contractual Clauses) |
| **Anthropic (Claude API)** | Adatfeldolgozo | Anthropic DPA ellenorzese, SCC szukseges (US ceg!) |
| **Resend (email)** | Adatfeldolgozo | DPA kotes |
| **Stripe (fizetes)** | Adatfeldolgozo | Stripe DPA automatikus |
| **Hetzner (szerver)** | Adatfeldolgozo | Hetzner DPA (EU/DE szerver - kedvezobb) |

### 2.5 Hataron atnyulo adattovabbitas

**KRITIKUS PROBLEMA:** A Cloudflare R2 es az Anthropic API adatot tovabbithat az EU-n kivulre (USA).

A Schrems II dontes utan:
- EU-US Data Privacy Framework (2023) ervenyes, DE bizonytalan hosszu tavon
- **Standard Contractual Clauses (SCC)** alkalmazasa **KOTELEZO**
- Transfer Impact Assessment (TIA) elkeszitese **KOTELEZO**

| Teendo | Prioritas | Becsult koltseg |
|--------|-----------|-----------------|
| SCC-k ellenorzese es dokumentalasa Cloudflare-rel | Indulas elott | 0 Ft (benne van a Cloudflare DPA-ban) |
| Anthropic adattovabbitasi hatasvizsgalat | Indulas elott | 50.000-100.000 Ft |
| Anonimizalas/pszeudonimizalas az AI elemzes elott | AJANLOTT | Fejlesztesi koltseg |
| EU-s AI szolgaltato alternativa felmerese | Kesobb | - |

### 2.6 Adatkezelesi Tajekoztato minimum tartalma

- Az adatkezelo neve, elereshetosege
- Az adatkezeles celja es jogalapja (minden adatkezelesi tevekenysegre kulon)
- A kezelt szemelyes adatok koze
- Adatmegorzesi idok
- Az erintettek jogai (hozzaferes, torles, helyesbites, hordozhatosag, tiltakozas)
- Adattovabbitas harmadik feleknek es harmadik orszagokba
- Cookie-k es nyomkoveto technologiak
- Automatizalt donteshozatal (AI elemzes!)
- NAIH elereshetosege panasztetelhez

---

## 3. CEGFORMA ES ADOZAS

### 3.1 Cegforma valasztas

| Cegforma | Alkalmas? | Elonyok | Hatranyok |
|----------|-----------|---------|-----------|
| **Egyeni vallalkozo (EV)** | Igen, indulaskor | Gyors, egyszeru, KATA lehetoseg | Korlatlan felelosseg, kevesbe profi |
| **Kft.** | **AJANLOTT** | Korlatolt felelosseg, professzionalis, befekteto-barat | 3M Ft torzstoke, konyvelesi koltseg |
| **Bt.** | Nem ajanlott | Olcsobb mint Kft | Beltag korlatlan felelossege |

**Ajánlás:** **Kft. alapitas** - a platform jellegebol adodoan (szerzodescek, felelosseg, B2B ugyfelek) a korlatolt felelosseg esszencialis.

### 3.2 Kft. alapitas koltsegei

| Tetel | Koltseg |
|-------|---------|
| Torzstoke (minimum) | 3.000.000 Ft (nem kell azonnal befizetni, 2 ev halasztas) |
| Ugyvedi dij (egyszerusitett eljaras) | 60.000-150.000 Ft |
| Cegjegyzeki illetak | 0 Ft (egyszerusitett elektronikus eljaras) |
| Szekhelyszolgaltatas (ha kell) | 3.000-15.000 Ft/ho |
| Konyvelo | 30.000-80.000 Ft/ho |
| Bankszamla | 0-5.000 Ft/ho |

### 3.3 Adozas

| Ado | Mertek | Megjegyzes |
|-----|--------|------------|
| **AFA** | **27%** | Standard kulcs. SaaS szolgaltatas AFA-koteles. B2C: magyar AFA. B2B EU: forditott adozas lehetseges. |
| **TAO (tarsasagi ado)** | 9% | EU legalacsonyabb |
| **SZJA (osztalek)** | 15% | Tulajdonosnak kifizetett osztalek utan |
| **SZOCHO** | 13% | Alkalmazottak utan |
| **IPA (helyi iparuzesi ado)** | 0-2% | Telephelytol fugg |
| **KIVA** | 10% | Alternativa (kisvallalati ado) - max 3 Mrd Ft arubevelet |

### 3.4 Szamlazasi kotelezetsegek

| Teendo | Statusz | Prioritas |
|--------|---------|-----------|
| **NAV Online Szamla csatlakozas** | **KOTELEZO** | Indulas elott |
| Szamlazas minden beveterol (AFA-s szamla) | **KOTELEZO** | Indulas elott |
| NAV XML adatszolgaltatas valós időben | **KOTELEZO** | Indulas elott |
| Szamlazo szoftver (Billingo, szamlazz.hu, stb.) | **KOTELEZO** | Indulas elott |

**FONTOS:** 2025. szeptember 15-tol szigorodnak a NAV Online Szamla validaciok. 15 korabbi figyelmezetes (WARN) hiba ettol keztve blokkolova (ERROR) valik. Hibankent akár 1.000.000 Ft birsag szabhato ki.

### 3.5 Kulon engedelyek

Elektronikus szerzodeskozelo platformhoz **NEM szukseges kulon mukosdesi engedely** Magyarorszagon, FELTEVE, hogy:
- Nem minositett bizalmi szolgaltatokent mukodik (ha igen: NMHH engedelyezes szukseges)
- Nem vegez penzforgalmi szolgaltatast (Stripe kezeli)
- Nem vegez biztositaskozvetites vagy penzugyi tanacsadast

---

## 4. ASZF ES JOGI DOKUMENTUMOK

### 4.1 Kotelezo jogi dokumentumok

| Dokumentum | Statusz | Prioritas | Becsult koltseg |
|------------|---------|-----------|-----------------|
| **ASZF (Altalanos Szerzodesi Feltetelek)** | **KOTELEZO** | Indulas elott | 100.000-300.000 Ft (ugyvedi) |
| **Adatkezelesi Tajekoztato** | **KOTELEZO** | Indulas elott | 80.000-200.000 Ft (ugyvedi) |
| **Cookie szabalyzat** | **KOTELEZO** | Indulas elott | Benne az adatkezelesi tajekoztatoban |
| **Felhasznalasi feltetelek** | **KOTELEZO** | Indulas elott | Benne az ASZF-ben |
| **Adatfeldolgozoi szerzodesek** | **KOTELEZO** | Indulas elott | 50.000-100.000 Ft |
| **SLA (Service Level Agreement)** | AJANLOTT | Indulas utan | Benne az ASZF-ben |

### 4.2 ASZF kotelezo tartalma (e-kereskedelmi torveny + Ptk.)

Az ASZF-nek tartalmaznia kell:
1. **Szolgaltato adatai:** nev, szaekhely, cegjegyzekszam, adoszam, elereshetoseg
2. **Szolgaltatas leirasa:** mit nyujt a platform
3. **Elofizetes feltetelek:** dijak, fizetesi modok, szamlazasi ciklus
4. **A szerzodesckotest megelozo technikai lepesek** es az azok javitasara felkinalt eszkozok
5. **Felelossegkorlatozas:**
   - A platform NEM felel a felhasznalok altal letrehozott szerzodescek tartalmaert
   - A platform NEM nyujt jogi tanacsadast
   - Az AI elemzes tajekoztato jellegu, nem minosul jogi velemenyneek
   - Maximum felelosseg: az adott elofizetesi dij osszege
6. **Szellemi tulajdon** es hasznalati jogok
7. **Megszuntetes:** mikor es hogyan szuntetheto meg az eloifzetes
8. **Vitarendezes:** alkalmazando jog (magyar), joghatosag
9. **Modositasi zaradek:** hogyan modosithato az ASZF, 15 napos ertesites
10. **Vis maior** esemenyek

### 4.3 Elallasi jog (14 napos)

A 45/2014. (II. 26.) Korm. rendelet alapjan:

- **B2C (fogyaszto felhasznalok):** 14 napos elallasi jog **JÁR**
  - DE: digitalis tartalom eseten a fogyaszto elore hozzajarulhat az azonnali teljesiteshez, elallasi jogarol lemondva
  - A platformon ezt egyertelmuen kozolni kell es hozzajarulast kell kerni
- **B2B:** Elallasi jog **NEM jar** (nem fogyasztoi szerzodes)

### 4.4 Fogyasztovedelmi kotelezetsegek (B2C)

Ha a platform termeszetes szemely (fogyaszto) ugyfeleket is szolgal ki:
- Az elallasi jogrol **elore** tajekoztatni kell
- Panaszkezelesi rend kialakitasa
- Bekelteto testuleti tajekoztatasi kotelezettseg
- Online vitarendzesi platform (ODR) linkjenek feltetele: https://ec.europa.eu/consumers/odr

---

## 5. BIZTOSITAS ES FELELOSSEG

### 5.1 Felelossegi kockazatok

| Kockazat | Leiras | Sulyossag |
|----------|---------|-----------|
| Szerzodes tartalom hibas | Felhasznalo a platform sablonjat hasznalja, de az nem felel meg a jogszabalynak | MAGAS |
| AI elemzes felrevezezo | A Claude API hibas jogi elemzest ad | KOZEPES |
| Adatszivargas | Szerzodescek, szemelyes adatok kiszivargasa | NAGYON MAGAS |
| Platform kieses | Fontos hataridohoz kotott szerzodescek nem airahatoak | KOZEPES |
| E-alairas vitatasa | Biroság elott vitatjak az alairas ervenyesseget | MAGAS |

### 5.2 Felelossegkorlatozasi strategia

1. **ASZF-ben vilagos disclaimer:**
   - A sablonok altalanos tajekoztato jelleguek, NEM minosulnek jogi tanacsadasnak
   - A platform nem felelos a szerzodescek jogi megalapozottságáert
   - AI elemzes: "Ez nem jogi velemeny, forduljon ugyvédhez"
2. **Maximum felelosseg korlatozasa** az elofizetesi dij osszegere (Ptk. lehetove teszi B2B-ben)
3. **B2C-ben a felelossegkorlatozas korlatozott** - szandekos es sulyosan gondatlan karokozas nem zarhato ki

### 5.3 Biztositasok

| Biztositas | Szukseges? | Prioritas | Becsult koltseg |
|------------|-----------|-----------|-----------------|
| **IT szakmai felelossegbiztositas** | EROSEN AJANLOTT | Indulas elott | 200.000-800.000 Ft/ev |
| **Cyber/adatvedelmi felelossegbiztositas** | EROSEN AJANLOTT | Indulas elott | 300.000-1.500.000 Ft/ev |
| **Altalanos felelossegbiztositas** | AJANLOTT | Indulas utan | 100.000-300.000 Ft/ev |
| **Kombinalt csomag (Colonnade, stb.)** | OPTIMALIS | Indulas elott | 400.000-1.200.000 Ft/ev |

**Szolgaltatok Magyarorszagon:**
- Colonnade Biztosito: IT szakmai + cyber kombinalt csomag
- Marsh: szakmai felelossegbiztositas
- Allianz, Generali: altalanos vallalati csomagok

---

## 6. FIZETESI RENDSZER

### 6.1 Stripe Magyarorszagon

A Stripe teljes koruen elerheto Magyarorszagon:
- Standard dij: 1.5% + 0.25 EUR (europaI kartyak), 3.25% + 0.25 EUR (nem europai)
- Stripe Billing: visszatertero fizetescek kezelese
- PSD2/SCA kompatibilis (Strong Customer Authentication)
- Automatikus adotartalek kezeles

### 6.2 Fizetesi szabalyozasi kotelezetsegek

| Teendo | Statusz | Prioritas |
|--------|---------|-----------|
| PSD2/SCA megfeleles (Stripe kezeli) | **KOTELEZO** | Automatikus |
| 14 napos elallasi jog kozlese B2C-ben | **KOTELEZO** | Indulas elott |
| Visszaterites szabalyzat | **KOTELEZO** | Indulas elott |
| Automatikus megujitas elotti ertesites | **KOTELEZO** (B2C) | Indulas elott |
| SEPA Direct Debit tamogatas | AJANLOTT | Kesobb |

### 6.3 Elofizetesi modellek jogi szempontbol

- **Ingyenes (free) tier:** Nincs kulonos kovetelmeny
- **Fizetois tieark:** Automatikus megujitasrol **elore** ertesiteni kell
- **Arvaltozas:** Legalabb 30 nappal elore kozolni
- **Lemondas:** Egyszeruen es barriermenten biztositani kell (EU Digital Services Act)

---

## 7. MAGYAR JOGSZABALYI HIVATKOZASOK

### Kozvetlenul alkalmazando jogszabalyok

| Jogszabaly | Tema | Relevancia |
|------------|------|------------|
| **EU 910/2014 (eIDAS)** | Elektronikus azonositas es bizalmi szolgaltatasok | Alairas jogi ervenyessege |
| **EU 2016/679 (GDPR)** | Adatvedelem | Teljes adatkezelesi rendszer |
| **2013. evi V. torveny (Ptk.)** | Polgari Torvenykonyv, 6:7.ss irasbeliseg | Szerzodesckootes, felelosseg |
| **2001. evi CVIII. torveny** | E-kereskedelmi torveny | Platform mukodasere vonatkozo kovetelmeneyk |
| **2011. evi CXII. torveny (Info tv.)** | Informacios onrendelkezesi jog | Adatkezelesi kovetelmeneyk |
| **2023. evi XLVI. torveny** | Fokozott biztonsagu alairas + irásbeliség | Elektronikus magankirat szabalyai |
| **45/2014. (II. 26.) Korm. rendelet** | Fogyaszto es vallalkozas kozotti szerzodescek | Elallasi jog, tajekoztatasi kotelezetseg |
| **2007. evi CXXVII. torveny (AFA tv.)** | Altalanos forgalmi ado | SaaS szolgaltatas AFA kezelese |
| **23/2014. (VI. 30.) NGM rendelet** | Online penztar/szamlazo kovetelmeneyek | NAV Online Szamla adatszolgaltatas |

---

## 8. OSSZESITETT CHECKLIST

### INDULAS ELOTT KOTELEZO (Must Have)

- [ ] **Cegforma:** Kft. alapitas (vagy EV ha tesztelési fazis)
- [ ] **ASZF** elkeszitese ugyveddel
- [ ] **Adatkezelesi Tajekoztato** elkeszitese
- [ ] **Cookie hozzajarulas kezeles** implementalasa
- [ ] **Adatkezelesi nyilvantartas (ROPA)** elkeszitese
- [ ] **Adatvedelmi hatasvizsgalat (DPIA)** - AI elemzes es szerzodesckezeles miatt
- [ ] **Adatfeldolgozoi szerzodescek (DPA):** Cloudflare, Anthropic, Resend, Stripe, Hetzner
- [ ] **SCC-k** ellenorzese es dokumentalasa (Cloudflare, Anthropic - USA adattovabbitas)
- [ ] **E-alairas figyelmeztetescek:** kozles, hogy SES =/= irásbeliség, nem minden szerzodescre elegendo
- [ ] **Audit trail** implementalasa (idopecset, IP, hash minden alairashoz)
- [ ] **NAV Online Szamla** csatlakozas + szamlazo szoftver
- [ ] **Szamlazas** beallitasa (Billingo/szamlazz.hu + NAV XML)
- [ ] **Stripe** integralasa + visszaterites szabalyzat
- [ ] **B2C elallasi jog** megfelelo kezelese (14 nap, lemondas)
- [ ] **ODR link** es bekelteto testuleti tajekoztatas (ha B2C)
- [ ] **AI disclaimer:** "Nem jogi velemeny" figyelmeztetescek az AI elemzesnel
- [ ] **Impresszum** a weboldaron (e-kereskedelmi torveny)

### INDULAS ELOTT EROSEN AJANLOTT (Should Have)

- [ ] **IT szakmai felelossegbiztositas** kotese
- [ ] **Cyber/adatvedelmi biztositas** kotese
- [ ] **Kulso DPO** megbizasa (ha nagyszamu felhasznalo varhato)
- [ ] **Adatbiztonsagi audit** vegzese
- [ ] **Jogi felulvizsgalat** a szerzodessablonokrol (ugyvedi)
- [ ] **Tesztszerzodes** kotes sajat magaddal, teljes flow ellenorzese

### INDULAS UTAN FEJLESZTHETO (Nice to Have)

- [ ] **DAP eAlairas integracio** (minositett szintu, ingyenes)
- [ ] **Microsec/NetLock integracio** (piaci QES, premium feature)
- [ ] **Stripe SEPA Direct Debit** tamogatas
- [ ] **KATA/KIVA** adozasi optimalizalas
- [ ] **SOC 2** vagy ISO 27001 tanusitas
- [ ] **Google OAuth** beallitas (mar fejlesztve van)
- [ ] **Pen test** (penetracios teszt)

---

## BECSULT INDULASI KOLTSEGEK OSSZESITESE

| Tetel | Minimum | Maximum |
|-------|---------|---------|
| Kft. alapitas (ugyvedi dij) | 60.000 Ft | 150.000 Ft |
| Torzstoke | 0 Ft (halasztott) | 3.000.000 Ft |
| ASZF + Adatkezelesi Tajekoztato (ugyvedi) | 150.000 Ft | 500.000 Ft |
| Adatvedelmi hatasvizsgalat | 100.000 Ft | 300.000 Ft |
| IT felelossegbiztositas + Cyber | 400.000 Ft | 1.500.000 Ft/ev |
| Konyvelo (eves) | 360.000 Ft | 960.000 Ft/ev |
| Szamlazo szoftver | 0 Ft | 50.000 Ft/ev |
| Domain + Hosting (mar megvan) | 0 Ft | 0 Ft |
| **OSSZESEN (elso ev)** | **~1.070.000 Ft** | **~6.460.000 Ft** |

---

## LEGFONTOSABB KOCKAZATOK

1. **LEGNAGYOBB KOCKAZAT:** Felhasznalok jogi kotoerojunek hiszik az egyszeru e-alairast, majd bírosag elott nem fogadjak el → **platform reputacios es jogi kockazata**
   - **Megoldas:** Egyertelmu tajekoztatascok + minositett alairas integracio

2. **GDPR buntetes kockazat:** Adatszivargas vagy nem megfelelo adatkezeles → NAIH birsag akár 20M EUR vagy globalsi arubevsetel 4%-a
   - **Megoldas:** DPIA, DPA-k, biztonsagi audit, cyber biztositas

3. **NAV birsag:** Szamlazasi hibak → akár 1.000.000 Ft/szamla
   - **Megoldas:** Megbizhato szamlazo szoftver, NAV Online Szamla teszt kornyezet hasznalata

4. **AI felelosseg:** Claude API felrevezetoő jogi elemzest ad → felhasznalo kart szenved
   - **Megoldas:** Disclaimer + felelossegkorlatozas az ASZF-ben

---

*Ez a dokumentum tajékoztato jellegu, es NEM minosul jogi tanacsadasnak. A kereskedelmi indulas elott ugyvedi konzultacio erosen ajanlott.*

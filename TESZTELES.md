# Legitas - Manuális Tesztelési Útmutató

**URL:** https://legitas.hu
**Dátum:** 2026-03-18

Kérlek, minden szituációnál írd le:
- Működik-e? (igen/nem)
- Ha nem, mi a hibaüzenet?
- Képernyőkép ha valami furcsát látsz
- Milyen eszközön tesztelted (telefon/laptop, böngésző)

---

## 1. REGISZTRÁCIÓ ÉS BELÉPÉS

### 1.1 Regisztráció
1. Nyisd meg: https://legitas.hu/register
2. Válaszd a "Cég / Egyéni vállalkozó" opciót
3. Töltsd ki:
   - Név: a te neved
   - Email: a te email címed
   - Jelszó: min. 8 karakter, nagybetű + szám + speciális karakter
   - Cégnév: bármi
   - Adószám: 12345678-1-42
4. Fogadd el az ÁSZF-et (checkbox)
5. Kattints "Ingyenes regisztráció"
6. **Elvárt:** Sikeres regisztráció, átirányítás a dashboardra
7. **Ellenőrizd:** Kaptál-e email verifikációs emailt?

### 1.2 Kijelentkezés + Bejelentkezés
1. Kattints a jobb felső profilképre → Kijelentkezés
2. Nyisd meg: https://legitas.hu/login
3. Add meg az emailed + jelszavad
4. Kattints "Bejelentkezés"
5. **Elvárt:** Bejelentkezés sikeres, dashboardon vagy

### 1.3 Elfelejtett jelszó
1. A login oldalon kattints "Elfelejtett jelszó?"
2. Add meg az emailed
3. Kattints "Jelszó-visszaállító link küldése"
4. **Elvárt:** Kapsz egy emailt jelszó-visszaállító linkkel
5. Kattints a linkre az emailben
6. Adj meg új jelszót
7. **Elvárt:** Jelszó sikeresen módosítva, be tudsz lépni az újjal

### 1.4 Cookie banner
1. Nyisd meg a főoldalt incognito módban
2. **Elvárt:** Cookie banner megjelenik alul
3. Kattints "Beállítások" → Ellenőrizd hogy a funkcionális és analitikai checkboxok kikapcsolhatók
4. Kattints "Csak szükségesek"
5. **Elvárt:** Banner eltűnik, "Cookie beállítások" gomb jelenik meg bal alul
6. Kattints a "Cookie beállítások" gombra
7. **Elvárt:** Banner újra megjelenik (GDPR visszavonás)

---

## 2. DASHBOARD

### 2.1 Főoldal áttekintés
1. Lépj be a fiókodba
2. **Ellenőrizd:**
   - Üdvözlő szöveg a neveddel
   - Statisztikai kártyák (Összes szerződés, Aláírásra vár, stb.)
   - "Új szerződés" gomb működik
   - Bal oldali navigáció minden elem kattintható

### 2.2 Navigáció (minden oldal betölt-e?)
Kattints végig a bal menün, és ellenőrizd hogy minden oldal betölt:
- [ ] Kezdőlap
- [ ] Új szerződés
- [ ] Sablonok
- [ ] Ajánlatok
- [ ] Partnerek
- [ ] Záradékok
- [ ] Analitika
- [ ] Naptár
- [ ] Emlékeztetők
- [ ] Beállítások

---

## 3. SZERZŐDÉS LÉTREHOZÁS (legfontosabb flow!)

### 3.1 Sablon alapú szerződés
1. Kattints "Új szerződés" a dashboardon
2. **Elvárt:** Sablon lista jelenik meg kategóriákkal
3. Válassz egy sablont (pl. "Megbízási szerződés") → "Kiválasztás"
4. **2. lépés - Kitöltés:**
   - Adj címet a szerződésnek
   - Töltsd ki az összes kötelező mezőt (piros csillaggal jelölt)
   - Kattints "Tovább"
5. **3. lépés - Aláírók:**
   - Válassz aláírási módot (pl. "Mindkét fél")
   - Add meg a partner nevét, emailjét
   - Kattints "Tovább"
6. **4. lépés - Összegzés:**
   - Ellenőrizd az adatokat
   - Kattints "Szerződés létrehozása"
7. **Elvárt:** Átirányítás a szerződés részletek oldalára, státusz: "Piszkozat"

### 3.2 Szerződés küldés aláírásra
1. A létrehozott szerződés oldalán kattints "Küldés aláírásra"
2. **Elvárt:** Státusz változik "Küldve"-re
3. **Ellenőrizd:** Az aláíró kapott-e emailt a szerződésről?

### 3.3 Szerződés lista
1. Menj a "Szerződések" oldalra (bal menü)
2. **Ellenőrizd:**
   - A létrehozott szerződés megjelenik
   - Státusz badge helyes (Piszkozat/Küldve)
   - Keresés működik (írd be a szerződés címét)
   - PDF ikon kattintható (letöltés)

---

## 4. ALÁÍRÁS (ezt egy MÁSIK emberrel teszteld!)

### 4.1 Aláírási folyamat (az aláíró szemszögéből)
**Előfeltétel:** Küldj egy szerződést valaki email címére (3.2 pont)

Az aláíró kapja ezt az instrukciót:

1. Nyisd meg az emailben kapott linket
2. **1. lépés - Azonosítás:**
   - Kattints "Kód kérése"
   - Nézd meg az emailedet — kaptál egy 6 jegyű kódot
   - Írd be a kódot
   - Kattints "Ellenőrzés"
3. **2. lépés - Adatok:**
   - Töltsd ki: teljes neved, cégnév, adószám, székhely
   - Ha vannak extra mezők, azokat is
   - Kattints "Tovább"
4. **3. lépés - Elolvasás:**
   - Görgess végig a szerződésen (alulra kell görgetni!)
   - **Elvárt:** "Tovább" gomb csak akkor aktív, ha alulra görgettél
5. **4. lépés - Aláírás:**
   - **Próbáld ki mind a 3 módszert:**
     - "Rajzolás" → rajzolj az ujjaddal/egérrel
     - "Gépelés" → írd be a neved
     - "Feltöltés" → tölts fel egy aláírás képet (jpg/png)
   - **Pecsét:** Próbáld meg feltölteni egy pecsétet is (opcionális)
   - Jelöld be az adatkezelési hozzájárulást
   - Kattints "Aláírás"
6. **Elvárt:** Sikeres aláírás üzenet

### 4.2 Mentett aláírás (ha van fiókod)
1. Lépj be a fiókodba
2. Menj: Beállítások → Aláírás (https://legitas.hu/settings/signature)
3. **Rajzold le** vagy **töltsd fel** az aláírásodat
4. Opcionálisan tölts fel pecsétet
5. Kattints "Aláírás mentése"
6. **Elvárt:** "Aláírás mentve!" üzenet
7. Most küldj magadnak egy szerződést és írd alá
8. Az aláírási oldalon **Elvárt:** megjelenik a "Mentett aláírás használata" gomb
9. Kattints rá → aláírás és pecsét automatikusan betöltődik

### 4.3 Aláírás visszautasítása
1. Nyiss meg egy aláírási linket
2. Az OTP ellenőrzés után kattints "Visszautasítás"
3. Adj meg egy okot
4. **Elvárt:** Visszautasítás sikeres, a szerződés státusza "Visszautasítva"

---

## 5. SABLONOK

### 5.1 Sablon böngészés
1. Menj: Sablonok (bal menü)
2. **Ellenőrizd:**
   - Legalább 15 sablon jelenik meg
   - Kategóriák szűrés működik (munkajogi, b2b, stb.)
   - Sablon kártya mutat: nevet, leírást, változók számát

### 5.2 Sablon előnézet
1. Kattints egy sablon "Előnézet" gombjára
2. **Elvárt:** Modal/popup a sablon HTML tartalmával

---

## 6. BEÁLLÍTÁSOK

### 6.1 Profil
1. Menj: Beállítások → Profil
2. Módosítsd a neved/cégnevet
3. Kattints "Mentés"
4. **Elvárt:** Sikeres mentés toast

### 6.2 Biztonság
1. Menj: Beállítások → Biztonság
2. **Ellenőrizd:**
   - Jelszó módosítás form működik
   - 2FA bekapcsolási opció látható

### 6.3 Értesítések
1. Menj: Beállítások → Értesítések
2. Kapcsold ki/be az egyes értesítés típusokat
3. Mentés
4. **Elvárt:** Beállítások elmentve

### 6.4 Számlázás
1. Menj: Beállítások → Számlázás
2. **Ellenőrizd:**
   - Jelenlegi csomag megjelenik
   - Kredit egyenleg látható
   - Csomag frissítés gombok működnek (Stripe checkout-ra visz)

### 6.5 Aláírás mentés
1. Menj: Beállítások → Aláírás
2. Rajzolj vagy tölts fel aláírást
3. Tölts fel pecsétet (opcionális)
4. Mentés
5. Törlés
6. **Elvárt:** Minden gomb működik, kép megjelenik

---

## 7. PARTNEREK (CRM)

### 7.1 Partner hozzáadás
1. Menj: Partnerek
2. Kattints "Új partner"
3. Töltsd ki: név, email, cég, csoport
4. Mentés
5. **Elvárt:** Partner megjelenik a listában

### 7.2 Partner profil
1. Kattints egy partner nevére
2. **Ellenőrizd:** Partner részletek, szerződés előzmények

---

## 8. AJÁNLATOK (Quotes)

### 8.1 Ajánlat létrehozás
1. Menj: Ajánlatok → Új ajánlat
2. Töltsd ki: ügyfél adatok, tételek (név, mennyiség, egységár)
3. Mentés
4. **Elvárt:** Ajánlat létrehozva, összeg kalkulálva

### 8.2 Ajánlat küldés
1. Az ajánlat oldalán kattints "Küldés"
2. **Elvárt:** Az ügyfél kap emailt az ajánlatról

---

## 9. PUBLIKUS OLDALAK

### 9.1 Landing page
1. Nyisd meg: https://legitas.hu/landing
2. **Ellenőrizd:**
   - Szép design, minden szekció betölt
   - CTA gombok működnek (regisztrációra visznek)
   - Mobilon is jól néz ki

### 9.2 Árak oldal
1. Nyisd meg: https://legitas.hu/pricing
2. **Ellenőrizd:**
   - 4 csomag megjelenik
   - Éves/havi váltó működik
   - "23% kedvezmény" éves fizetésnél
   - "Regisztrálok" gombok működnek

### 9.3 Blog
1. Nyisd meg: https://legitas.hu/blog
2. **Ellenőrizd:**
   - Cikkek listája (16 db)
   - Kattints egy cikkre → cikk betölt, tartalmas

### 9.4 Jogi oldalak
Nyisd meg és ellenőrizd hogy betölt:
- [ ] https://legitas.hu/aszf (ÁSZF)
- [ ] https://legitas.hu/adatvedelem (Adatvédelem)
- [ ] https://legitas.hu/cookie (Cookie szabályzat)
- [ ] https://legitas.hu/impresszum (Impresszum)

---

## 10. MOBIL TESZTELÉS

Ismételd meg a következő flow-kat TELEFONON:
- [ ] 1.1 Regisztráció
- [ ] 1.2 Bejelentkezés
- [ ] 3.1 Szerződés létrehozás (sablon kiválasztás, kitöltés)
- [ ] 4.1 Aláírás (rajzolás ujjal, feltöltés)
- [ ] 9.1 Landing page (responsive design)

**Figyelj:**
- Menü működik-e (hamburger ikon)?
- Gombok elég nagyok-e?
- Szöveg olvasható?
- Rajzolás működik-e az ujjaddal?

---

## 11. SZÉLSŐSÉGES ESETEK

### 11.1 Hibaüzenetek
1. Próbálj bejelentkezni rossz jelszóval
   - **Elvárt:** "Hibás email vagy jelszó" (nem árulja el melyik rossz)
2. Próbálj regisztrálni meglévő emaillel
   - **Elvárt:** Hibaüzenet
3. Próbálj szerződést létrehozni üres mezőkkel
   - **Elvárt:** Validációs hibaüzenet

### 11.2 Böngésző tesztek
Próbáld ki legalább 2 böngészőben:
- [ ] Chrome
- [ ] Safari (ha Mac/iPhone)
- [ ] Firefox

### 11.3 Sötét mód
1. Kattints a nap/hold ikonra a fejlécben
2. **Elvárt:** Az egész oldal sötét módra vált
3. **Ellenőrizd:** Minden szöveg olvasható, nincs fehér szöveg fehér háttéren

---

## 12. TELJESÍTMÉNY

### 12.1 Betöltési idő
- Landing page: < 3 másodperc
- Dashboard: < 2 másodperc
- Aláírás oldal: < 3 másodperc

### 12.2 Keresés
1. A globális keresőben (Ctrl+K) keress rá valamire
2. **Elvárt:** Eredmények < 1 másodperc

---

## VISSZAJELZÉS SABLON

Minden tesztnél használd ezt a formátumot:

```
Teszt: [pl. 3.1 Sablon alapú szerződés]
Eszköz: [pl. iPhone 15, Safari]
Eredmény: [Sikeres / Sikertelen]
Megjegyzés: [mi volt jó, mi volt rossz, screenshot link]
```

Köszönjük a tesztelést!

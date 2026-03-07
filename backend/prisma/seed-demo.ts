import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding demo data...');

  const DEMO_EMAIL = 'demo@szerzodes.hu';
  const passwordHash = await bcrypt.hash('Demo1234', 10);

  // ─── Clean up existing demo data ───────────────────────────────
  const existingUser = await prisma.user.findUnique({ where: { email: DEMO_EMAIL } });
  if (existingUser) {
    // Delete in dependency order
    await prisma.quoteComment.deleteMany({ where: { quote: { ownerId: existingUser.id } } });
    await prisma.quoteItem.deleteMany({ where: { quote: { ownerId: existingUser.id } } });
    await prisma.quote.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.quoteTemplate.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.auditLog.deleteMany({ where: { contract: { ownerId: existingUser.id } } });
    await prisma.comment.deleteMany({ where: { userId: existingUser.id } });
    await prisma.signer.deleteMany({ where: { contract: { ownerId: existingUser.id } } });
    await prisma.contractTag.deleteMany({ where: { contract: { ownerId: existingUser.id } } });
    await prisma.contractVersion.deleteMany({ where: { contract: { ownerId: existingUser.id } } });
    await prisma.contract.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.contact.deleteMany({ where: { userId: existingUser.id } });
    await prisma.tag.deleteMany({ where: { userId: existingUser.id } });
    await prisma.folder.deleteMany({ where: { userId: existingUser.id } });
    await prisma.notification.deleteMany({ where: { userId: existingUser.id } });
    await prisma.session.deleteMany({ where: { userId: existingUser.id } });
    await prisma.apiKey.deleteMany({ where: { userId: existingUser.id } });
    await prisma.webhook.deleteMany({ where: { userId: existingUser.id } });
    await prisma.referral.deleteMany({ where: { referrerId: existingUser.id } });
    await prisma.teamMember.deleteMany({ where: { userId: existingUser.id } });
    await prisma.team.deleteMany({ where: { ownerId: existingUser.id } });
    await prisma.user.delete({ where: { id: existingUser.id } });
    console.log('Existing demo data cleaned up.');
  }

  // ─── 1. Create demo user ──────────────────────────────────────
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      passwordHash,
      name: 'Kovács János',
      companyName: 'Kovács és Társa Kft.',
      subscriptionTier: 'pro',
      brandColor: '#198296',
      phone: '+36 30 123 4567',
      taxNumber: '12345678-2-42',
      role: 'admin',
    },
  });
  console.log(`User created: ${user.email} (${user.id})`);

  // ─── 2. Create contacts ───────────────────────────────────────
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Nagy Péter',
        email: 'nagy.peter@example.hu',
        company: 'NP Solutions Kft.',
        phone: '+36 20 555 1234',
        taxNumber: '23456789-2-13',
        address: '1052 Budapest, Váci utca 10.',
      },
    }),
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Szabó Anna',
        email: 'szabo.anna@example.hu',
        company: 'Szabó Ügyvédi Iroda',
        phone: '+36 70 888 5678',
        taxNumber: '34567890-1-41',
        address: '1011 Budapest, Fő utca 22.',
      },
    }),
    prisma.contact.create({
      data: {
        userId: user.id,
        name: 'Tóth Gábor',
        email: 'toth.gabor@example.hu',
        company: 'TG Design Studio',
        phone: '+36 30 222 9876',
        address: '6720 Szeged, Kárász utca 5.',
      },
    }),
  ]);
  console.log(`Contacts created: ${contacts.length}`);

  // ─── Helper: date offsets ──────────────────────────────────────
  const now = new Date();
  function daysAgo(days: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d;
  }
  function daysFromNow(days: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + days);
    return d;
  }

  // ─── 3. Create contracts ───────────────────────────────────────
  const contractData = [
    {
      title: 'Webfejlesztési szerződés',
      status: 'draft',
      contentHtml: '<h1>Webfejlesztési szerződés</h1><p>Jelen szerződés tárgya a megbízó weboldalának fejlesztése a megállapodott specifikáció szerint.</p><p>A fejlesztés magában foglalja a frontend és backend munkálatokat, valamint a tesztelést.</p>',
      createdAt: daysAgo(5),
    },
    {
      title: 'Üzemeltetési szerződés',
      status: 'draft',
      contentHtml: '<h1>Üzemeltetési szerződés</h1><p>A szolgáltató vállalja a megbízó informatikai rendszereinek folyamatos üzemeltetését és karbantartását.</p>',
      createdAt: daysAgo(2),
    },
    {
      title: 'Bérleti szerződés - Irodahelyiség',
      status: 'sent',
      contentHtml: '<h1>Bérleti szerződés</h1><p>Jelen szerződéssel a bérbeadó bérbe adja a 1052 Budapest, Váci utca 10. szám alatti, 85 m2 alapterületű irodahelyiséget.</p><p>A bérleti díj havi 450.000 Ft + ÁFA.</p>',
      createdAt: daysAgo(30),
      expiresAt: daysFromNow(30),
      signers: [
        { name: 'Nagy Péter', email: 'nagy.peter@example.hu', role: 'Bérlő', signingOrder: 1, status: 'pending' },
      ],
    },
    {
      title: 'Megbízási szerződés - Marketing tanácsadás',
      status: 'sent',
      contentHtml: '<h1>Megbízási szerződés</h1><p>A Megbízott vállalja, hogy a Megbízó részére marketing tanácsadási szolgáltatást nyújt, amely magában foglalja a piacelemzést, stratégia kidolgozást és kampánytervezést.</p><p>Megbízási díj: 800.000 Ft/hó + ÁFA.</p>',
      createdAt: daysAgo(14),
      expiresAt: daysFromNow(16),
      signers: [
        { name: 'Szabó Anna', email: 'szabo.anna@example.hu', role: 'Megbízott', signingOrder: 1, status: 'pending' },
        { name: 'Tóth Gábor', email: 'toth.gabor@example.hu', role: 'Tanú', signingOrder: 2, status: 'pending' },
      ],
    },
    {
      title: 'Szoftverlicenc szerződés',
      status: 'completed',
      contentHtml: '<h1>Szoftverlicenc szerződés</h1><p>A licencadó a jelen szerződés alapján nem kizárólagos, időben korlátlan felhasználási jogot biztosít a Megrendelő részére az alábbi szoftvertermékre.</p><p>Licencdíj: egyszeri 2.500.000 Ft + ÁFA.</p>',
      createdAt: daysAgo(60),
      signers: [
        { name: 'Nagy Péter', email: 'nagy.peter@example.hu', role: 'Megrendelő', signingOrder: 1, status: 'signed', signedAt: daysAgo(55), signatureMethod: 'drawn' },
        { name: 'Kovács János', email: 'demo@szerzodes.hu', role: 'Licencadó', signingOrder: 2, status: 'signed', signedAt: daysAgo(54), signatureMethod: 'typed', typedName: 'Kovács János' },
      ],
    },
    {
      title: 'Adatvédelmi megállapodás (DPA)',
      status: 'completed',
      contentHtml: '<h1>Adatfeldolgozói megállapodás</h1><p>Jelen megállapodás az Európai Parlament és a Tanács (EU) 2016/679 rendelete (GDPR) 28. cikke alapján jött létre.</p><p>Az Adatfeldolgozó kizárólag az Adatkezelő utasításai alapján kezeli a személyes adatokat.</p>',
      createdAt: daysAgo(75),
      signers: [
        { name: 'Szabó Anna', email: 'szabo.anna@example.hu', role: 'Adatkezelő', signingOrder: 1, status: 'signed', signedAt: daysAgo(72), signatureMethod: 'typed', typedName: 'Dr. Szabó Anna' },
      ],
    },
    {
      title: 'NDA - Titoktartási megállapodás',
      status: 'declined',
      contentHtml: '<h1>Titoktartási megállapodás (NDA)</h1><p>A Felek kötelezettséget vállalnak arra, hogy a másik Fél bizalmas információit nem hozzák nyilvánosságra és azokat kizárólag a közös projekt céljára használják fel.</p>',
      createdAt: daysAgo(45),
      signers: [
        { name: 'Tóth Gábor', email: 'toth.gabor@example.hu', role: 'Fél', signingOrder: 1, status: 'declined', signerNote: 'A titoktartási időszak túl hosszú, 5 év helyett 2 évet javaslok.' },
      ],
    },
    {
      title: 'Vállalkozási szerződés - Honlap redesign',
      status: 'expired',
      contentHtml: '<h1>Vállalkozási szerződés</h1><p>A Vállalkozó vállalja a Megrendelő meglévő honlapjának teljes újratervezését és fejlesztését a mellékelt specifikáció alapján.</p><p>Vállalkozási díj: 3.200.000 Ft + ÁFA, teljesítési határidő: 60 nap.</p>',
      createdAt: daysAgo(90),
      expiresAt: daysAgo(30),
      signers: [
        { name: 'Nagy Péter', email: 'nagy.peter@example.hu', role: 'Megrendelő', signingOrder: 1, status: 'pending' },
      ],
    },
  ];

  const createdContracts: any[] = [];
  for (const c of contractData) {
    const { signers, ...contractFields } = c as any;
    const contract = await prisma.contract.create({
      data: {
        title: contractFields.title,
        ownerId: user.id,
        contentHtml: contractFields.contentHtml,
        status: contractFields.status,
        createdAt: contractFields.createdAt,
        expiresAt: contractFields.expiresAt,
      },
    });

    if (signers && signers.length > 0) {
      for (const s of signers) {
        await prisma.signer.create({
          data: {
            contractId: contract.id,
            name: s.name,
            email: s.email,
            role: s.role,
            signingOrder: s.signingOrder,
            status: s.status,
            signToken: randomUUID(),
            tokenExpiresAt: daysFromNow(30),
            signedAt: s.signedAt || null,
            signatureMethod: s.signatureMethod || null,
            typedName: s.typedName || null,
            signerNote: s.signerNote || null,
          },
        });
      }
    }

    createdContracts.push(contract);
  }
  console.log(`Contracts created: ${createdContracts.length}`);

  // ─── 4. Create quote templates ────────────────────────────────
  const webDevTemplate = await prisma.quoteTemplate.create({
    data: {
      ownerId: user.id,
      name: 'Webfejlesztési ajánlat',
      description: 'Standard webfejlesztési projekt ajánlat sablon',
      category: 'it',
      currency: 'HUF',
      introText: 'Tisztelt Partnerünk! Köszönjük megkeresését. Az alábbiakban küldjük ajánlatunkat a kért webfejlesztési projektre vonatkozóan.',
      outroText: 'Ajánlatunk 30 napig érvényes. Kérdés esetén állunk rendelkezésre.',
      itemsJson: JSON.stringify([
        { description: 'UI/UX tervezés', quantity: 1, unitPrice: 350000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'Frontend fejlesztés (React)', quantity: 80, unitPrice: 15000, unit: 'ora', taxRate: 27, sortOrder: 1 },
        { description: 'Backend fejlesztés (Node.js)', quantity: 60, unitPrice: 18000, unit: 'ora', taxRate: 27, sortOrder: 2 },
        { description: 'Tesztelés és hibajavítás', quantity: 20, unitPrice: 12000, unit: 'ora', taxRate: 27, sortOrder: 3 },
        { description: 'Éles környezet beüzemelés', quantity: 1, unitPrice: 150000, unit: 'projekt', taxRate: 27, sortOrder: 4 },
      ]),
    },
  });

  const consultingTemplate = await prisma.quoteTemplate.create({
    data: {
      ownerId: user.id,
      name: 'Tanácsadási ajánlat',
      description: 'Üzleti és IT tanácsadási szolgáltatás ajánlat sablon',
      category: 'tanácsadás',
      currency: 'HUF',
      introText: 'Tisztelt Leendő Partnerünk! Az alábbi ajánlatot nyújtjuk be tanácsadási szolgáltatásainkra vonatkozóan.',
      outroText: 'Az árak nettó árak, az ÁFA mértéke 27%. Ajánlatunk 14 napig érvényes.',
      itemsJson: JSON.stringify([
        { description: 'Helyzetfelmérés és audit', quantity: 1, unitPrice: 250000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'Stratégiai tanácsadás', quantity: 10, unitPrice: 25000, unit: 'ora', taxRate: 27, sortOrder: 1 },
        { description: 'Havi riport és follow-up', quantity: 3, unitPrice: 80000, unit: 'honap', taxRate: 27, sortOrder: 2 },
      ]),
    },
  });
  console.log(`Quote templates created: 2`);

  // ─── 5. Create quotes ─────────────────────────────────────────
  const quoteData = [
    {
      title: 'Weboldal fejlesztési ajánlat - NP Solutions',
      clientName: 'Nagy Péter',
      clientEmail: 'nagy.peter@example.hu',
      clientCompany: 'NP Solutions Kft.',
      clientTaxNumber: '23456789-2-13',
      clientAddress: '1052 Budapest, Váci utca 10.',
      status: 'draft',
      quoteNumber: 'AJ-2026-0001',
      currency: 'HUF',
      validUntil: daysFromNow(30),
      introText: 'Tisztelt Nagy Péter! Az alábbiakban küldjük ajánlatunkat a megbeszélt webfejlesztési projektre.',
      createdAt: daysAgo(3),
      templateId: webDevTemplate.id,
      items: [
        { description: 'Weboldal tervezés (UI/UX)', quantity: 1, unitPrice: 400000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'Frontend fejlesztés', quantity: 60, unitPrice: 15000, unit: 'ora', taxRate: 27, sortOrder: 1 },
        { description: 'Backend fejlesztés', quantity: 40, unitPrice: 18000, unit: 'ora', taxRate: 27, sortOrder: 2 },
      ],
    },
    {
      title: 'SEO és marketing csomag',
      clientName: 'Szabó Anna',
      clientEmail: 'szabo.anna@example.hu',
      clientCompany: 'Szabó Ügyvédi Iroda',
      status: 'sent',
      quoteNumber: 'AJ-2026-0002',
      currency: 'HUF',
      validUntil: daysFromNow(14),
      viewToken: randomUUID(),
      introText: 'Tisztelt Szabó Anna! Ajánlatunkat az alábbiak szerint állítottuk össze az Ön irodájának online megjelenéséhez.',
      createdAt: daysAgo(10),
      items: [
        { description: 'SEO audit és kulcsszókutatás', quantity: 1, unitPrice: 180000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'On-page SEO optimalizálás', quantity: 1, unitPrice: 250000, unit: 'projekt', taxRate: 27, sortOrder: 1 },
        { description: 'Havi SEO karbantartás', quantity: 6, unitPrice: 95000, unit: 'honap', taxRate: 27, sortOrder: 2 },
        { description: 'Google Ads kampánykezelés', quantity: 6, unitPrice: 120000, unit: 'honap', taxRate: 27, sortOrder: 3 },
      ],
    },
    {
      title: 'Mobilalkalmazás fejlesztési ajánlat',
      clientName: 'Tóth Gábor',
      clientEmail: 'toth.gabor@example.hu',
      clientCompany: 'TG Design Studio',
      status: 'sent',
      quoteNumber: 'AJ-2026-0003',
      currency: 'HUF',
      validUntil: daysFromNow(21),
      viewToken: randomUUID(),
      introText: 'Kedves Tóth Gábor! Köszönjük a megkeresést. Az alábbi ajánlatot készítettük el a mobil applikáció fejlesztésére.',
      createdAt: daysAgo(7),
      items: [
        { description: 'Applikáció tervezés és prototípus', quantity: 1, unitPrice: 500000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'React Native fejlesztés', quantity: 120, unitPrice: 16000, unit: 'ora', taxRate: 27, sortOrder: 1 },
        { description: 'API integráció', quantity: 30, unitPrice: 18000, unit: 'ora', taxRate: 27, sortOrder: 2 },
        { description: 'App Store / Play Store publikáció', quantity: 1, unitPrice: 100000, unit: 'projekt', taxRate: 27, sortOrder: 3 },
      ],
    },
    {
      title: 'IT tanácsadás és rendszeraudit',
      clientName: 'Nagy Péter',
      clientEmail: 'nagy.peter@example.hu',
      clientCompany: 'NP Solutions Kft.',
      status: 'accepted',
      quoteNumber: 'AJ-2026-0004',
      currency: 'HUF',
      validUntil: daysAgo(5),
      acceptedAt: daysAgo(20),
      templateId: consultingTemplate.id,
      introText: 'Tisztelt Nagy Péter! Az alábbiakban részletezzük IT tanácsadási szolgáltatásaink ajánlatát.',
      createdAt: daysAgo(45),
      items: [
        { description: 'IT infrastruktúra audit', quantity: 1, unitPrice: 350000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'Biztonsági felülvizsgálat', quantity: 1, unitPrice: 280000, unit: 'projekt', taxRate: 27, sortOrder: 1 },
        { description: 'Tanácsadói óradíj', quantity: 15, unitPrice: 25000, unit: 'ora', taxRate: 27, sortOrder: 2 },
      ],
    },
    {
      title: 'Grafikai arculattervezés',
      clientName: 'Tóth Gábor',
      clientEmail: 'toth.gabor@example.hu',
      clientCompany: 'TG Design Studio',
      status: 'declined',
      quoteNumber: 'AJ-2026-0005',
      currency: 'HUF',
      validUntil: daysAgo(10),
      declinedAt: daysAgo(25),
      declineReason: 'Az árazás meghaladja a jelenlegi keretünket. Kérjük, küldjenek egy módosított ajánlatot alacsonyabb árszinttel.',
      introText: 'Kedves Tóth Gábor! Ajánlatunkat az alábbiakban részletezzük a teljes arculattervezési projektre.',
      createdAt: daysAgo(40),
      items: [
        { description: 'Logó tervezés (3 koncepció)', quantity: 1, unitPrice: 300000, unit: 'projekt', taxRate: 27, sortOrder: 0 },
        { description: 'Arculati kézikönyv', quantity: 1, unitPrice: 450000, unit: 'projekt', taxRate: 27, sortOrder: 1 },
        { description: 'Névjegykártya és levélpapír design', quantity: 1, unitPrice: 120000, unit: 'projekt', taxRate: 27, sortOrder: 2 },
      ],
    },
    {
      title: 'Rendszerüzemeltetési ajánlat',
      clientName: 'Szabó Anna',
      clientEmail: 'szabo.anna@example.hu',
      clientCompany: 'Szabó Ügyvédi Iroda',
      status: 'expired',
      quoteNumber: 'AJ-2026-0006',
      currency: 'HUF',
      validUntil: daysAgo(15),
      introText: 'Tisztelt Szabó Anna! Ajánlatunkat az alábbiak szerint nyújtjuk be az IT rendszereik üzemeltetésére.',
      createdAt: daysAgo(60),
      items: [
        { description: 'Szerver üzemeltetés (havi)', quantity: 12, unitPrice: 85000, unit: 'honap', taxRate: 27, sortOrder: 0 },
        { description: 'Biztonsági mentés szolgáltatás', quantity: 12, unitPrice: 35000, unit: 'honap', taxRate: 27, sortOrder: 1 },
      ],
    },
  ];

  const createdQuotes: any[] = [];
  for (const q of quoteData) {
    const { items, ...quoteFields } = q;
    const quote = await prisma.quote.create({
      data: {
        ownerId: user.id,
        title: quoteFields.title,
        clientName: quoteFields.clientName,
        clientEmail: quoteFields.clientEmail,
        clientCompany: quoteFields.clientCompany || null,
        clientTaxNumber: (quoteFields as any).clientTaxNumber || null,
        clientAddress: (quoteFields as any).clientAddress || null,
        status: quoteFields.status,
        quoteNumber: quoteFields.quoteNumber,
        currency: quoteFields.currency,
        validUntil: quoteFields.validUntil,
        viewToken: (quoteFields as any).viewToken || null,
        introText: quoteFields.introText || null,
        templateId: (quoteFields as any).templateId || null,
        declineReason: (quoteFields as any).declineReason || null,
        acceptedAt: (quoteFields as any).acceptedAt || null,
        declinedAt: (quoteFields as any).declinedAt || null,
        createdAt: quoteFields.createdAt,
      },
    });

    for (const item of items) {
      await prisma.quoteItem.create({
        data: {
          quoteId: quote.id,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          taxRate: item.taxRate,
          sortOrder: item.sortOrder,
        },
      });
    }

    createdQuotes.push(quote);
  }
  console.log(`Quotes created: ${createdQuotes.length}`);

  // ─── 6. Create audit log entries ──────────────────────────────
  const auditEntries = [
    {
      contractId: createdContracts[4].id, // Szoftverlicenc - completed
      eventType: 'contract.created',
      eventData: JSON.stringify({ title: 'Szoftverlicenc szerződés' }),
      createdAt: daysAgo(60),
    },
    {
      contractId: createdContracts[4].id,
      eventType: 'contract.sent',
      eventData: JSON.stringify({ recipients: ['nagy.peter@example.hu'] }),
      createdAt: daysAgo(59),
    },
    {
      contractId: createdContracts[4].id,
      eventType: 'signer.signed',
      eventData: JSON.stringify({ signerName: 'Nagy Péter', method: 'drawn' }),
      createdAt: daysAgo(55),
    },
    {
      contractId: createdContracts[4].id,
      eventType: 'contract.completed',
      eventData: JSON.stringify({ allSignersSigned: true }),
      createdAt: daysAgo(54),
    },
    {
      contractId: createdContracts[2].id, // Bérleti szerződés - sent
      eventType: 'contract.created',
      eventData: JSON.stringify({ title: 'Bérleti szerződés - Irodahelyiség' }),
      createdAt: daysAgo(30),
    },
    {
      contractId: createdContracts[2].id,
      eventType: 'contract.sent',
      eventData: JSON.stringify({ recipients: ['nagy.peter@example.hu'] }),
      createdAt: daysAgo(29),
    },
    {
      contractId: createdContracts[6].id, // NDA - declined
      eventType: 'contract.created',
      eventData: JSON.stringify({ title: 'NDA - Titoktartási megállapodás' }),
      createdAt: daysAgo(45),
    },
    {
      contractId: createdContracts[6].id,
      eventType: 'signer.declined',
      eventData: JSON.stringify({ signerName: 'Tóth Gábor', reason: 'A titoktartási időszak túl hosszú' }),
      createdAt: daysAgo(40),
    },
    {
      contractId: createdContracts[0].id, // Webfejlesztési - draft
      eventType: 'contract.created',
      eventData: JSON.stringify({ title: 'Webfejlesztési szerződés' }),
      createdAt: daysAgo(5),
    },
    {
      contractId: createdContracts[1].id, // Üzemeltetési - draft
      eventType: 'contract.created',
      eventData: JSON.stringify({ title: 'Üzemeltetési szerződés' }),
      createdAt: daysAgo(2),
    },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({ data: entry });
  }
  console.log(`Audit log entries created: ${auditEntries.length}`);

  // ─── 7. Create tags ───────────────────────────────────────────
  const tags = await Promise.all([
    prisma.tag.create({ data: { userId: user.id, name: 'Fontos', color: '#EF4444' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'IT projekt', color: '#3B82F6' } }),
    prisma.tag.create({ data: { userId: user.id, name: 'Bérleti', color: '#10B981' } }),
  ]);

  // Tag some contracts
  await prisma.contractTag.create({ data: { contractId: createdContracts[0].id, tagId: tags[1].id } }); // Webfejlesztési -> IT projekt
  await prisma.contractTag.create({ data: { contractId: createdContracts[4].id, tagId: tags[1].id } }); // Szoftverlicenc -> IT projekt
  await prisma.contractTag.create({ data: { contractId: createdContracts[4].id, tagId: tags[0].id } }); // Szoftverlicenc -> Fontos
  await prisma.contractTag.create({ data: { contractId: createdContracts[2].id, tagId: tags[2].id } }); // Bérleti -> Bérleti
  console.log(`Tags created: ${tags.length}`);

  // ─── 8. Create notifications ──────────────────────────────────
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: user.id,
        type: 'contract_completed',
        title: 'Szerződés aláírva',
        message: 'A "Szoftverlicenc szerződés" minden fél által aláírásra került.',
        read: true,
        createdAt: daysAgo(54),
      },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        type: 'contract_declined',
        title: 'Szerződés elutasítva',
        message: 'Tóth Gábor elutasította az "NDA - Titoktartási megállapodás" aláírását.',
        read: true,
        createdAt: daysAgo(40),
      },
    }),
    prisma.notification.create({
      data: {
        userId: user.id,
        type: 'reminder',
        title: 'Aláírás emlékeztető',
        message: 'A "Bérleti szerződés - Irodahelyiség" aláírása még függőben van.',
        read: false,
        createdAt: daysAgo(1),
      },
    }),
  ]);
  console.log('Notifications created: 3');

  console.log('\n========================================');
  console.log('Demo data created! Login: demo@szerzodes.hu / Demo1234');
  console.log('========================================\n');
}

main()
  .catch((e) => {
    console.error('Error seeding demo data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

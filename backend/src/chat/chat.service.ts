import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ChatService {
  private client: Anthropic | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async askQuestion(userId: string, question: string): Promise<string> {
    if (!this.client) {
      return 'Az AI asszisztens jelenleg nem elerheto. Kerjuk alltsa be az ANTHROPIC_API_KEY-t.';
    }

    // Fetch user's contracts as context
    const contracts = await this.prisma.contract.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        expiresAt: true,
        signers: {
          select: {
            name: true,
            email: true,
            status: true,
            signedAt: true,
            role: true,
          },
        },
        template: {
          select: { name: true, category: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    });

    const contractsSummary = contracts.map((c) => ({
      cim: c.title,
      statusz: c.status,
      letrehozva: c.createdAt.toISOString().split('T')[0],
      modositva: c.updatedAt.toISOString().split('T')[0],
      lejar: c.expiresAt ? c.expiresAt.toISOString().split('T')[0] : null,
      sablon: c.template?.name ?? null,
      kategoria: c.template?.category ?? null,
      alairok: c.signers.map((s) => ({
        nev: s.name,
        email: s.email,
        statusz: s.status,
        szerep: s.role,
        alairva: s.signedAt ? s.signedAt.toISOString().split('T')[0] : null,
      })),
    }));

    const systemPrompt = `Te egy szerzodeskotesi asszisztens vagy. A felhasznalo szerzodesei alapjan valaszolj a kerdesekre magyarul.
Legy tomor es hasznos. Ha nem talalsz relevansat, mond el.

A felhasznalonak osszesen ${contracts.length} szerződese van. Ime az adatok:

${JSON.stringify(contractsSummary, null, 2)}

Statusz magyarazat: draft = piszkozat, sent = elkuldott, partially_signed = reszben alairt, completed = teljesitett, declined = visszautasitott, expired = lejart, cancelled = visszavont, archived = archivalt.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: question,
          },
        ],
      });

      const text =
        response.content[0].type === 'text' ? response.content[0].text : '';
      return text || 'Nem sikerult valaszt generalni. Kerjuk, probald ujra.';
    } catch (error: any) {
      console.error('Chat AI error:', error?.message);
      return 'Hiba tortent az AI valaszgeneralas soran. Kerjuk, probald ujra kesobb.';
    }
  }
}

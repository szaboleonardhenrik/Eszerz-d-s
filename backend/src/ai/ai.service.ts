import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 200;

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class AiService {
  private client: Anthropic | null = null;
  private readonly logger = new Logger(AiService.name);
  private cache = new Map<string, CacheEntry<any>>();

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  private getCacheKey(prefix: string, content: string): string {
    return `${prefix}:${createHash('sha256').update(content).digest('hex')}`;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  private setCache<T>(key: string, data: T): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  async analyzeContract(contractHtml: string): Promise<{
    summary: string;
    risks: string[];
    suggestions: string[];
    missingClauses: string[];
    legalCompliance: string;
    dataDisclosure?: string;
  }> {
    if (!this.client) {
      throw new Error('AI szolgáltatás nincs konfigurálva');
    }

    const strippedText = contractHtml.replace(/<[^>]*>/g, ' ').substring(0, 8000);
    const cacheKey = this.getCacheKey('analyze', strippedText);
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) {
      this.logger.debug('AI analysis cache hit');
      return cached;
    }

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `Te egy magyar jogi szakértő AI vagy. Elemezd az alábbi szerződést és adj vissza egy JSON objektumot az alábbi struktúrában:
{
  "summary": "Rövid, 2-3 mondatos összefoglaló a szerződés lényegéről",
  "risks": ["Lista a potenciális kockázatokról vagy problémákról"],
  "suggestions": ["Lista a javítási javaslatokról"],
  "missingClauses": ["Lista a hiányzó fontos záradékokról (pl. vis maior, felmondás, adatvédelem)"],
  "legalCompliance": "Rövid értékelés a Ptk. megfelelőségről"
}

Csak a JSON-t add vissza, semmi mást. A szerződés:

${strippedText}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const dataDisclosure =
      'Az elemzéshez a szerződés szövege az Anthropic (USA) AI szolgáltatónak került továbbításra. Az adatok nem kerülnek tartós tárolásra a szolgáltató rendszerében.';

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const result = { ...JSON.parse(jsonMatch[0]), dataDisclosure };
      this.setCache(cacheKey, result);
      return result;
    } catch {
      return {
        summary: text.substring(0, 500),
        risks: [],
        suggestions: [],
        missingClauses: [],
        legalCompliance: 'Nem sikerült az elemzés feldolgozása.',
        dataDisclosure,
      };
    }
  }

  async riskAnalysis(contractHtml: string): Promise<{
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    categories: {
      name: string;
      risk: 'low' | 'medium' | 'high' | 'critical';
      issues: { title: string; description: string; severity: 'info' | 'warning' | 'error' | 'critical'; suggestion: string }[];
    }[];
    summary: string;
  }> {
    if (!this.client) {
      throw new Error('AI szolgáltatás nincs konfigurálva');
    }

    const strippedText = contractHtml.replace(/<[^>]*>/g, ' ').substring(0, 8000);
    const cacheKey = this.getCacheKey('risk', strippedText);
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) {
      this.logger.debug('Risk analysis cache hit');
      return cached;
    }

    const response = await this.client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `Te egy magyar jogi kockázatelemző AI vagy. Elemezd az alábbi szerződés kockázatait és adj vissza egy JSON objektumot az alábbi struktúrában:
{
  "overallRisk": "low" | "medium" | "high" | "critical",
  "score": 0-100 (ahol 100 a legkockázatosabb),
  "categories": [
    {
      "name": "Kategória neve (pl. Pénzügyi kockázatok, Jogi hiányosságok, Felmondási feltételek, Felelősségkorlátozás, Adatvédelem, Szellemi tulajdon, Vitarendezés)",
      "risk": "low" | "medium" | "high" | "critical",
      "issues": [
        {
          "title": "Probléma rövid megnevezése",
          "description": "Részletes leírás, miért probléma",
          "severity": "info" | "warning" | "error" | "critical",
          "suggestion": "Konkrét javaslat a javításra"
        }
      ]
    }
  ],
  "summary": "2-3 mondatos összefoglaló a kockázati szintről és a legfontosabb problémákról"
}

Értékeld a következő szempontok szerint:
- Ptk. megfelelőség
- Hiányzó vagy gyenge záradékok (vis maior, felmondás, kötbér, titoktartás)
- Egyoldalú vagy méltánytalan feltételek
- Adatvédelmi (GDPR) hiányosságok
- Felelősségkorlátozás mértéke
- Vitarendezési mechanizmus
- Szellemi tulajdonjogi kérdések

Csak a JSON-t add vissza, semmi mást. A szerződés:

${strippedText}`,
        },
      ],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      const result = JSON.parse(jsonMatch[0]);
      this.setCache(cacheKey, result);
      return result;
    } catch {
      return {
        overallRisk: 'medium',
        score: 50,
        categories: [],
        summary: 'Nem sikerült a kockázatelemzés feldolgozása. Kérjük, próbáld újra.',
      };
    }
  }
}

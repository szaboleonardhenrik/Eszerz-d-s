import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AiService {
  private client: Anthropic | null = null;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('ANTHROPIC_API_KEY');
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async analyzeContract(contractHtml: string): Promise<{
    summary: string;
    risks: string[];
    suggestions: string[];
    missingClauses: string[];
    legalCompliance: string;
  }> {
    if (!this.client) {
      throw new Error('AI szolgáltatás nincs konfigurálva');
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

${contractHtml.replace(/<[^>]*>/g, ' ').substring(0, 8000)}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found');
      return JSON.parse(jsonMatch[0]);
    } catch {
      return {
        summary: text.substring(0, 500),
        risks: [],
        suggestions: [],
        missingClauses: [],
        legalCompliance: 'Nem sikerült az elemzés feldolgozása.',
      };
    }
  }
}

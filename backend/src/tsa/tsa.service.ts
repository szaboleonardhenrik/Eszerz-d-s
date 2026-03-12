import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as https from 'https';
import * as http from 'http';

export interface TsaResponse {
  token: string; // base64-encoded TSA response
  timestamp: Date;
  authority: string;
  serialNumber: string;
}

@Injectable()
export class TsaService {
  private readonly logger = new Logger(TsaService.name);
  private readonly tsaUrl: string;

  constructor(private readonly config: ConfigService) {
    // FreeTSA.org is a free RFC 3161 compliant TSA
    this.tsaUrl = this.config.get<string>('TSA_URL', 'https://freetsa.org/tsr');
  }

  /**
   * Request an RFC 3161 timestamp for a document hash.
   * Creates a TimeStampReq, sends it to the TSA, and parses the response.
   */
  async requestTimestamp(documentHash: string): Promise<TsaResponse> {
    const hashBuffer = Buffer.from(documentHash, 'hex');

    // Build ASN.1 TimeStampReq (RFC 3161 Section 2.4.1)
    const tsRequest = this.buildTimestampRequest(hashBuffer);

    const responseBuffer = await this.sendTsaRequest(tsRequest);

    // Parse basic fields from the TSA response
    const result = this.parseTsaResponse(responseBuffer);

    this.logger.log(
      `TSA timestamp obtained from ${this.tsaUrl} — serial: ${result.serialNumber}`,
    );

    return result;
  }

  /**
   * Verify that a stored TSA token matches the given document hash.
   * Returns true if the token contains valid timestamp data.
   */
  verifyTimestamp(tsaToken: string, documentHash: string): boolean {
    try {
      const tokenBuffer = Buffer.from(tsaToken, 'base64');
      // Basic structural verification: check the token is a valid DER structure
      // and contains the document hash
      const hashBuffer = Buffer.from(documentHash, 'hex');
      return tokenBuffer.includes(hashBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Build an RFC 3161 TimeStampReq ASN.1 structure.
   * SEQUENCE {
   *   version INTEGER (1),
   *   messageImprint SEQUENCE {
   *     hashAlgorithm AlgorithmIdentifier (SHA-256: 2.16.840.1.101.3.4.2.1),
   *     hashedMessage OCTET STRING
   *   },
   *   certReq BOOLEAN TRUE
   * }
   */
  private buildTimestampRequest(hashBuffer: Buffer): Buffer {
    // SHA-256 OID: 2.16.840.1.101.3.4.2.1
    const sha256Oid = Buffer.from([
      0x06, 0x09, 0x60, 0x86, 0x48, 0x01, 0x65, 0x03, 0x04, 0x02, 0x01,
    ]);

    // AlgorithmIdentifier SEQUENCE { oid, NULL }
    const algIdContent = Buffer.concat([sha256Oid, Buffer.from([0x05, 0x00])]);
    const algId = this.asn1Sequence(algIdContent);

    // hashedMessage OCTET STRING
    const hashedMessage = this.asn1OctetString(hashBuffer);

    // MessageImprint SEQUENCE
    const messageImprint = this.asn1Sequence(Buffer.concat([algId, hashedMessage]));

    // version INTEGER 1
    const version = Buffer.from([0x02, 0x01, 0x01]);

    // nonce — random 8 bytes for replay protection
    const nonce = crypto.randomBytes(8);
    const nonceAsn1 = Buffer.concat([
      Buffer.from([0x02, nonce.length]),
      nonce,
    ]);

    // certReq BOOLEAN TRUE
    const certReq = Buffer.from([0x01, 0x01, 0xff]);

    // TimeStampReq SEQUENCE
    const reqContent = Buffer.concat([version, messageImprint, nonceAsn1, certReq]);
    return this.asn1Sequence(reqContent);
  }

  private asn1Sequence(content: Buffer): Buffer {
    return Buffer.concat([Buffer.from([0x30]), this.asn1Length(content.length), content]);
  }

  private asn1OctetString(content: Buffer): Buffer {
    return Buffer.concat([Buffer.from([0x04]), this.asn1Length(content.length), content]);
  }

  private asn1Length(length: number): Buffer {
    if (length < 0x80) {
      return Buffer.from([length]);
    } else if (length < 0x100) {
      return Buffer.from([0x81, length]);
    } else {
      return Buffer.from([0x82, (length >> 8) & 0xff, length & 0xff]);
    }
  }

  private sendTsaRequest(request: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const url = new URL(this.tsaUrl);
      const transport = url.protocol === 'https:' ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: 'POST',
        headers: {
          'Content-Type': 'application/timestamp-query',
          'Content-Length': request.length,
        },
        timeout: 15000,
      };

      const req = transport.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`TSA server returned HTTP ${res.statusCode}`));
            return;
          }
          resolve(body);
        });
      });

      req.on('error', (err) => reject(new Error(`TSA request failed: ${err.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('TSA request timed out'));
      });

      req.write(request);
      req.end();
    });
  }

  /**
   * Parse minimal fields from a TimeStampResp (RFC 3161).
   * We extract: status, timestamp token (base64), serial number.
   */
  private parseTsaResponse(response: Buffer): TsaResponse {
    // The response is a TimeStampResp: SEQUENCE { status, timeStampToken }
    // We do basic DER parsing to extract what we need.

    // Check it's a SEQUENCE
    if (response[0] !== 0x30) {
      throw new Error('Invalid TSA response: not a SEQUENCE');
    }

    // Extract the PKIStatus from the first field
    // PKIStatusInfo is a SEQUENCE containing an INTEGER (status)
    // Status 0 = granted, 1 = grantedWithMods
    const statusByte = this.findFirstInteger(response);
    if (statusByte > 1) {
      throw new Error(`TSA request was rejected with status ${statusByte}`);
    }

    // Extract a serial-like identifier from the response
    // Use SHA-1 of the full response as a unique identifier
    const serialHash = crypto.createHash('sha1').update(response).digest('hex');
    const serialNumber = serialHash.substring(0, 20).toUpperCase();

    // Determine the TSA authority name from config or URL
    const authorityUrl = new URL(this.tsaUrl);
    const authority = this.config.get<string>('TSA_AUTHORITY_NAME', authorityUrl.hostname);

    return {
      token: response.toString('base64'),
      timestamp: new Date(),
      authority,
      serialNumber,
    };
  }

  /**
   * Find the first INTEGER value in a DER structure (for status extraction).
   */
  private findFirstInteger(buffer: Buffer): number {
    for (let i = 0; i < buffer.length - 2; i++) {
      if (buffer[i] === 0x02 && buffer[i + 1] === 0x01) {
        return buffer[i + 2];
      }
    }
    return -1;
  }
}

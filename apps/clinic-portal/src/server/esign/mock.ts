import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { ESignProvider } from './types';

/**
 * Mock provider:
 * - Immediately marks the envelope completed
 * - Returns the original PDFs as "signed" artifacts (dev only)
 *
 * This lets you build UI/DB and storage NOW, before DocuSign is configured.
 */
export class MockESignProvider implements ESignProvider {
  async createAndCompleteEnvelope(params: { caseId: string; language: 'FR' | 'EN' }) {
    const providerEnvelopeId = `mock_${crypto.randomUUID()}`;

    // For now we only ship FR (per your instruction).
    // TODO: add EN templates later; you mentioned EN is often embedded in the FR PDF fine print.
    const base = path.resolve(process.cwd(), 'assets/forms');

    const eyeqnow = await fs.readFile(path.join(base, 'EYEQNOW_EnrollmentForm_SH_FR_PP-EYL-CA-0371-1.pdf'));
    const consentDocx = await fs.readFile(path.join(base, 'Consent - Pharmacie Kevin Boivin inc..docx'));
    const rx = await fs.readFile(path.join(base, 'Prescription francais Pharmacie Sentrex Eric Beaulieu pour Eylea PFS.pdf'));

    // NOTE: consent is DOCX; in real DocuSign template you will upload a PDF version.
    // For the MVP, we store the DOCX bytes as-is. You can later convert to PDF (server-side) if needed.
    return {
      envelope: { provider: 'mock' as const, providerEnvelopeId },
      completedDocs: [
        { type: 'EYEQNOW_ENROLLMENT', pdfBytes: eyeqnow, templateVersion: 'PP-EYL-CA-0371-1' },
        { type: 'PHARMACY_CONSENT', pdfBytes: consentDocx, templateVersion: 'KB-Consent-v1' },
        { type: 'PRESCRIPTION', pdfBytes: rx, templateVersion: 'Rx-v1' },
      ],
    };
  }
}

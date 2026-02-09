export type ESignProviderName = 'mock' | 'docusign';

export type DocType = 'EYEQNOW_ENROLLMENT' | 'PHARMACY_CONSENT' | 'PRESCRIPTION';

export interface ESignResult {
  provider: ESignProviderName;
  providerEnvelopeId: string;
  // In embedded/in-person signing, you'd return URLs.
  // For mock, we return nothing and auto-complete instantly.
}

export interface ESignProvider {
  createAndCompleteEnvelope(params: {
    caseId: string;
    language: 'FR' | 'EN';
  }): Promise<{
    envelope: ESignResult;
    completedDocs: Array<{ type: DocType; pdfBytes: Buffer; templateVersion?: string }>;
  }>;
}

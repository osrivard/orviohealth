import { MockESignProvider } from './mock';
import { ESignProvider, ESignProviderName } from './types';

// Simple provider factory. Swap to DocuSign once configured.
export function getESignProvider(): ESignProvider {
  const name = (process.env.ESIGN_PROVIDER || 'mock') as ESignProviderName;

  switch (name) {
    case 'mock':
      return new MockESignProvider();
    case 'docusign':
      // TODO: implement DocusignESignProvider in ./docusign.ts
      throw new Error('DocuSign provider not implemented yet. Set ESIGN_PROVIDER=mock for now.');
    default:
      return new MockESignProvider();
  }
}

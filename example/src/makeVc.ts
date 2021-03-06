import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import * as ed25519 from '@transmute/did-key-ed25519';
import { FastifyWalletFactory } from './walletFactory';

import { documentLoader } from './__fixtures__/documentLoader';

export const makeVc = async (wallet: FastifyWalletFactory, type: string) => {
  const signingKey = wallet.contents[1];
  return wallet.issue({
    credential: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        {
          [type]: 'https://example.com/' + type,
        },
      ],
      id: 'https://example.com/credentials/123',
      type: ['VerifiableCredential', type],
      issuer: signingKey.controller,
      issuanceDate: '2019-12-03T12:19:52Z',
      credentialSubject: {
        id: 'did:example:456',
      },
    },
    options: {
      documentLoader,
      suite: new Ed25519Signature2018({
        key: await ed25519.Ed25519KeyPair.from(signingKey),
      }),
    },
  });
};

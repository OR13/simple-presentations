import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import * as ed25519 from '@transmute/did-key-ed25519';
import { FastifyWalletFactory } from './walletFactory';

import { documentLoader } from './__fixtures__/documentLoader';

export const makeVp = async (
  wallet: FastifyWalletFactory,
  verifiableCredential: any[],
  domain: string,
  challenge: string
) => {
  const signingKey = wallet.contents[1];
  return wallet.createVerifiablePresentation({
    verifiableCredential: verifiableCredential,
    options: {
      documentLoader,
      holder: signingKey.controller,
      challenge,
      domain,
      suite: new Ed25519Signature2018({
        key: await ed25519.Ed25519KeyPair.from(signingKey),
      }),
    },
  });
};

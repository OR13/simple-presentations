import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import { FastifyWalletFactory } from './walletFactory';

import { documentLoader } from './__fixtures__/documentLoader';

export const verifyVp = async (
  wallet: FastifyWalletFactory,
  vp: any,
  domain: string,
  challenge: string
) => {
  return wallet.verifyPresentation({
    presentation: vp,
    options: {
      domain,
      challenge,
      documentLoader,
      suite: new Ed25519Signature2018(),
    },
  });
};

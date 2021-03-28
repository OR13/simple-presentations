import { Ed25519Signature2018 } from '@transmute/ed25519-signature-2018';
import { FastifyWalletFactory } from './walletFactory';

import { documentLoader } from './__fixtures__/documentLoader';

export const verifyVc = async (wallet: FastifyWalletFactory, vc: any) => {
  return wallet.verifyCredential({
    credential: vc,
    options: {
      documentLoader,
      suite: new Ed25519Signature2018(),
    },
  });
};

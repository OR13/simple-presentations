import aliceEncryptedWallet from '../__fixtures__/alice.wallet.json';

import { makeVc } from '../makeVc';
import { verifyVc } from '../verifyVc';
import { walletFactory, FastifyWalletFactory } from '../walletFactory';

let aliceWallet: FastifyWalletFactory;

beforeAll(async () => {
  aliceWallet = (await walletFactory
    .build()
    .import(aliceEncryptedWallet, 'alice')) as FastifyWalletFactory;
});

let vc: any;

it('sign', async () => {
  vc = await makeVc(aliceWallet, 'IntentToSell');
  expect(vc.proof.type).toBe('Ed25519Signature2018');
});

it('verify', async () => {
  const verification = await verifyVc(aliceWallet, vc);
  expect(verification.verified).toBe(true);
});

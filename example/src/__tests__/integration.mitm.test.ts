import { walletFactory, FastifyWalletFactory } from '../walletFactory';
import { makeVc } from '../makeVc';
import { makeVp } from '../makeVp';
import { verifyVp } from '../verifyVp';
import {
  createNotificationRequestBody,
  getNotificationResponseBody,
  getChallengeForPresentation,
  assertPresentationIsAuthorized,
} from '../exchange';

import aliceEncryptedWallet from '../__fixtures__/alice.wallet.json';
import bobEncryptedWallet from '../__fixtures__/bob.wallet.json';
import eveEncryptedWallet from '../__fixtures__/eve.wallet.json';

let aliceWallet: FastifyWalletFactory;
let bobWallet: FastifyWalletFactory;
let eveWallet: FastifyWalletFactory;

beforeAll(async () => {
  aliceWallet = (await walletFactory
    .build()
    .import(aliceEncryptedWallet, 'alice')) as FastifyWalletFactory;

  bobWallet = (await walletFactory
    .build()
    .import(bobEncryptedWallet, 'bob')) as FastifyWalletFactory;

  bobWallet.add({
    type: 'FlowRequirements',
    authorized: {
      IntentToSellProductCategory: [
        'IntentToSell',
        'ProductCertificate',
        'InvoiceCertificate',
        'ShippingCertificate',
      ],
    },
  });

  bobWallet.add({
    type: 'AuthorizedFlows',
    authorized: {
      [aliceWallet.contents[1].controller]: ['IntentToSellProductCategory'],
    },
  });

  eveWallet = (await walletFactory
    .build()
    .import(eveEncryptedWallet, 'eve')) as FastifyWalletFactory;
});

let aliceIntentQuery: any;
let bobsChallengeForAliceIntentQuery: any;
let aliceVerifiablePresentationForBob: any;

const verifyPresentationChallengesObjectName = 'PresentationChallenges';

describe('Alice presents credentials to Bob', () => {
  it('alice generates her intentful presentation flow query', async () => {
    aliceIntentQuery = createNotificationRequestBody(
      'IntentToSellProductCategory'
    );
  });

  // alice submits her intent to bob (over a transport)
  it(`bob generates a challenge for alice's intent and holds it in his wallet`, async () => {
    const domain = 'bob.example.com';
    bobsChallengeForAliceIntentQuery = getNotificationResponseBody(
      bobWallet,
      domain,
      aliceIntentQuery
    );
    const presentationIndex = `urn:${bobsChallengeForAliceIntentQuery.domain}:${bobsChallengeForAliceIntentQuery.challenge}`;
    bobWallet.add({
      type: verifyPresentationChallengesObjectName,
      pending: {
        [presentationIndex]: bobsChallengeForAliceIntentQuery,
      },
    });
  });

  // bob replies to alice with his challenge
  it(`alice crafts a presentation for bob's challenge`, async () => {
    let credentialsForBob = [];
    for (let requestedVcType of bobsChallengeForAliceIntentQuery.query[0]
      .credentialQuery.example.type) {
      // normally alice would already have these credentials
      // for this demo we generate them on the fly for whatever bob requests
      const vc = await makeVc(aliceWallet, requestedVcType);
      credentialsForBob.push(vc);
    }
    aliceVerifiablePresentationForBob = await makeVp(
      aliceWallet,
      credentialsForBob,
      bobsChallengeForAliceIntentQuery.domain,
      bobsChallengeForAliceIntentQuery.challenge
    );

    expect(aliceVerifiablePresentationForBob.proof.type).toBe(
      'Ed25519Signature2018'
    );
    expect(aliceVerifiablePresentationForBob.proof.domain).toBe(
      bobsChallengeForAliceIntentQuery.domain
    );
    expect(aliceVerifiablePresentationForBob.proof.challenge).toBe(
      bobsChallengeForAliceIntentQuery.challenge
    );
  });
  // alice submits her presentation to bob
  // eve attempts to mitm
  it(`eve crafts a presentation for bob's challenge, and throws away alice's reply`, async () => {
    let credentialsForBob = [];
    for (let requestedVcType of bobsChallengeForAliceIntentQuery.query[0]
      .credentialQuery.example.type) {
      // normally alice would already have these credentials
      // for this demo we generate them on the fly for whatever bob requests
      const vc = await makeVc(eveWallet, requestedVcType);
      credentialsForBob.push(vc);
    }
    // note the assignment here, this stands in for eve's ability to maul network traffic.
    aliceVerifiablePresentationForBob = await makeVp(
      eveWallet, // eve pretending to be alice
      credentialsForBob,
      bobsChallengeForAliceIntentQuery.domain,
      bobsChallengeForAliceIntentQuery.challenge
    );

    // note that eve can't sign as alice, so here the best she can do is pretend to be a
    // fresh identitifier for alice.
    expect(aliceVerifiablePresentationForBob.proof.type).toBe(
      'Ed25519Signature2018'
    );
    expect(aliceVerifiablePresentationForBob.proof.domain).toBe(
      bobsChallengeForAliceIntentQuery.domain
    );
    expect(aliceVerifiablePresentationForBob.proof.challenge).toBe(
      bobsChallengeForAliceIntentQuery.challenge
    );
  });

  it(`bob verifies alice's presentation by comparing with his stored challenge`, async () => {
    // bob can reconstruct the index for for alice's vp
    // so he can easily find if the previously challenged her
    const vp = aliceVerifiablePresentationForBob;
    const presentationIndex = `urn:${vp.proof.domain}:${vp.proof.challenge}`;
    const bobsChallenge = getChallengeForPresentation(bobWallet, vp);
    const verification = await verifyVp(
      bobWallet,
      vp,
      bobsChallenge.pending[presentationIndex].domain,
      bobsChallenge.pending[presentationIndex].challenge
    );
    expect(verification.verified).toBe(true);
    if (verification.verified) {
      // now that eve is authenticated, bob checks to see if she
      // presented anything she is not allowed to
      try {
        await assertPresentationIsAuthorized(bobWallet, vp);
      } catch (e) {
        expect(e.message).toBe(
          'Wallet has no presentation authorizations for did:key:z6MkovSJtWTE4iC8WdfKzSkgnpLkQgeeE9rfjHBABssFtsKY'
        );
      }
    }
    // we should not delete the challenge, or eve can us this to DoS Alice's ability to present?
    // delete bobsChallenge.pending[presentationIndex];
  });
});

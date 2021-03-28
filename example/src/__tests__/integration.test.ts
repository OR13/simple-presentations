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

let aliceWallet: FastifyWalletFactory;
let bobWallet: FastifyWalletFactory;

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
});

let aliceIntentQuery: any;
let bobsChallengeForAliceIntentQuery: any;
let aliceVerifiablePresentationForBob: any;

const verifyPresentationChallengesObjectName = 'PresentationChallenges';
const verifiedPresentationsInboxName = 'FlaggedForReview';

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

    // bob only stores credentials after verifying them
    if (verification.verified) {
      // now that alice is authenticated, bob checks to see if she
      // presented anything she is not allowed to
      await assertPresentationIsAuthorized(bobWallet, vp);
      // wallet may forward the verified presentation to other systems
      // OR wallet may decide that a human still needs to review
      // this object stores things a human needs to review.
      const flaggedForHumanReview: any = {
        type: verifiedPresentationsInboxName,
        presentations: [],
      };
      flaggedForHumanReview.presentations.push(vp);
      bobWallet.add(flaggedForHumanReview);
    }
    // after storing credentials, bob purges expects presentations map
    delete bobsChallenge.pending[presentationIndex];
  });
});

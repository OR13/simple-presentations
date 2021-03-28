import { v4 as uuidv4 } from 'uuid';
import { FastifyWalletFactory } from './walletFactory';

const verifyPresentationChallengesObjectName = 'PresentationChallenges';
// const verifiedPresentationsInboxName = 'FlaggedForReview';

export const createNotificationRequestBody = (
  type: string,
  recipients?: string[]
) => {
  const payload: any = {
    query: [
      {
        type,
      },
    ],
  };
  if (recipients !== undefined) {
    payload.recipients = recipients;
  }
  return payload;
};

// todo: refactor to take objects instead of wallet.
export const getNotificationResponseBody = (
  wallet: FastifyWalletFactory,
  domain: string,
  flow: any
) => {
  const flowRequirements = wallet.contents.find(c => {
    return c.type === 'FlowRequirements';
  });
  if (!flowRequirements) {
    throw new Error('Wallet does not contain FlowRequirements');
  }

  const flowTypes = flowRequirements.authorized[flow.query[0].type];

  if (!flowTypes) {
    throw new Error(`Flow Requirements does not contain ${flow.query[0].type}`);
  }

  return {
    query: [
      {
        type: 'QueryByExample',
        credentialQuery: {
          reason: `${domain} is requesting credentials, in response to ${flow.query[0].type}`,
          example: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: flowTypes,
          },
        },
      },
    ],
    challenge: uuidv4(),
    domain: domain,
  };
};

export const getChallengeForPresentation = (
  wallet: FastifyWalletFactory,
  vp: any
) => {
  const presentationIndex = `urn:${vp.proof.domain}:${vp.proof.challenge}`;
  const flow = wallet.contents.find((c: any) => {
    if (c.type !== verifyPresentationChallengesObjectName) {
      return false;
    }
    if (c.pending[presentationIndex] === undefined) {
      return false;
    }
    return true;
  });
  // should throw if presented a vp for a domain and challenge that are not expected
  // should expire challenges.
  if (flow === undefined) {
    throw new Error('Wallet has no record of this challenge');
  }
  return flow;
};

// todo: refactor to take objects instead of wallet.
export const assertPresentationIsAuthorized = (
  wallet: FastifyWalletFactory,
  vp: any
) => {
  let authorizedFlows = wallet.contents.find((c: any) => {
    return c.type === 'AuthorizedFlows';
  });

  if (!authorizedFlows.authorized[vp.holder]) {
    throw new Error(
      `Wallet has no presentation authorizations for ${vp.holder}`
    );
  }

  const flowsHolderIsAuthorizedFor = authorizedFlows.authorized[vp.holder];

  let flowRequirements = wallet.contents.find((c: any) => {
    return c.type === 'FlowRequirements';
  });

  const requirementsForFlowsHolderIsAuthorizedFor = flowsHolderIsAuthorizedFor.map(
    (flow: string) => {
      return flowRequirements.authorized[flow];
    }
  );

  const typesInVp = vp.verifiableCredential.map((vc: any) => {
    return vc.type.pop();
  });

  const allowed = new Set(requirementsForFlowsHolderIsAuthorizedFor[0]);
  const submitted = typesInVp;
  const submissionsNotAllowed = submitted.filter((x: any) => !allowed.has(x));
  if (submissionsNotAllowed.length) {
    throw new Error(
      'presentation contained submissions of credentials that holder is not authorized to present.'
    );
  }
};

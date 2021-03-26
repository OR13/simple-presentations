import { v4 as uuidv4 } from 'uuid';

// this should be a credential
// similar to a PE Presentation Definition
const flowCredentialsMap: any = {
  IntentToSellProductCategory: [
    'IntentToSell',
    'ProductCertificate',
    'InvoiceCertificate',
    'ShippingCertificate',
  ],
};

// this should be a credential
// similar to a PE Presentation Definition
// const presenterAuthorizedTypesMap: any = {
//   'did:example:123': ['IntentToSellProductCategory'],
// };

export const getCredentialTypes = (type: string) => {
  if (flowCredentialsMap[type]) {
    return flowCredentialsMap[type];
  }
  throw new Error('No credential types matching query.');
};

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

export const getNotificationResponseBody = (domain: string, flow: any) => {
  // match required credential to query type
  // normally a database query
  if (flow.query && flowCredentialsMap[flow.query[0].type]) {
    return {
      query: [
        {
          type: 'QueryByExample',
          credentialQuery: {
            reason: `${domain} is requesting credentials.`,
            example: {
              '@context': ['https://www.w3.org/2018/credentials/v1'],
              type: getCredentialTypes(flow.query[0].type),
            },
          },
        },
      ],
      challenge: uuidv4(),
      domain: domain,
    };
  }
  throw new Error('Unsupported query type');
};

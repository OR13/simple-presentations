import {
  createNotificationRequestBody,
  getNotificationResponseBody,
} from './exchange';

describe('notify', () => {
  const request = createNotificationRequestBody('IntentToSellProductCategory');
  it('request', () => {
    expect(request).toEqual({
      query: [{ type: 'IntentToSellProductCategory' }],
    });
  });
  // send request over network
  const domain = 'example.com';
  const response = getNotificationResponseBody(domain, request);
  it('response', () => {
    expect(response.query).toEqual([
      {
        type: 'QueryByExample',
        credentialQuery: {
          reason: `${domain} is requesting credentials.`,
          example: {
            '@context': ['https://www.w3.org/2018/credentials/v1'],
            type: [
              'IntentToSell',
              'ProductCertificate',
              'InvoiceCertificate',
              'ShippingCertificate',
            ],
          },
        },
      },
    ]);
    expect(response.challenge).toBeDefined();
    expect(response.domain).toBe(domain);
  });
});

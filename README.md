# Simple Presentations

A proposal to use [vp-request-spec](https://w3c-ccg.github.io/vp-request-spec/) with [universal-wallet-interop-spec](https://github.com/w3c-ccg/universal-wallet-interop-spec) to enable peer to peer data exchange using [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/).

## Proposed New Wallet Objects

Consider all these names subject to change.

### Flow Requirements

This object describes credentials and other data that should be presented together.

This is loosely analogout to [presentation-definition](https://identity.foundation/presentation-exchange/#presentation-definition), but drastically simpler.

This object can be combined with JSON Schemas, such as [Bill Of Lading Schema Example](https://w3c-ccg.github.io/traceability-vocab/#BillOfLadingCertificate), to enable precise JSON requirements.

Since we can assume all VC and valid JSON-LD we don't need any of the confusing complexity associated with [Input Descriptors](https://identity.foundation/presentation-exchange/#input-descriptor-object).

```json
{
  "type": "FlowRequirements",
  "authorized": {
    "IntentToSellProductCategory": [
      "IntentToSell",
      "ProductCertificate",
      "InvoiceCertificate",
      "ShippingCertificate"
    ]
  }
}
```

### Authorized Flows

This object describes what flows an identifier is authorized to produce presentations for.

This is similar to th PE spec concept of [holder-and-subject-binding](https://identity.foundation/presentation-exchange/#holder-and-subject-binding), but more generic and less precise.

A holder may be authorized to present credentials of various types which in turn may have many different subjects.

This object is used by the verifier as a kind of "allow-list", to help decide what to do with presentations that are valid and verified, but from parties who have no business submitting them.

```json
{
  "type": "AuthorizedFlows",
  "authorized": {
    "did:key:z6MkseybELFb2FJRp5hrHP92RPJzHMeLmnYLRAUHatqanjuw": [
      "IntentToSellProductCategory"
    ]
  }
}
```

### Presentation Challenges

This object allows a verifier to easily look up challenges they have made to a holder.

A verifier uses this state (these challenges) to authenticate the holder.

A verifier can store this object in their wallet, or in a database and reconstruct it via a query.

This object shows outstanding presentations the verifier is expecting.

There is a potential resource exhaustion attack here, verifiers should regularly purge this object or the associated database.

Note that similar attack exists on OIDC, see [here](https://openid.net/specs/openid-authentication-2_0.html#anchor46)... IP filtering, ratelimiting are recommended mitigations.

You can review the peer to peer security implications for this object [here](https://w3c-ccg.github.io/vp-request-spec/#peer-to-peer).

```json
{
  "type": "PresentationChallenges",
  "pending": {
    "urn:bob.example.com:ffd0bc37-2522-421f-862e-ae48ca19de54": {
      "query": [
        {
          "type": "QueryByExample",
          "credentialQuery": {
            "reason": "bob.example.com is requesting credentials, in response to IntentToSellProductCategory",
            "example": {
              "@context": ["https://www.w3.org/2018/credentials/v1"],
              "type": [
                "IntentToSell",
                "ProductCertificate",
                "InvoiceCertificate",
                "ShippingCertificate"
              ]
            }
          }
        }
      ],
      "challenge": "ffd0bc37-2522-421f-862e-ae48ca19de54",
      "domain": "bob.example.com"
    }
  }
}
```

## Use Cases

### Meeting Compliance Requirements

See [integration.test.ts](./example/src/__tests__/integration.test.ts).

Alice is required to submit certain required credentials in order to sell products, and Bob's job is to review Alice's submission.

Alice could be a foreign manufacturer and Bob could be a domestic customs officer, or Alice could own an online business and Bob could own an online marketplace that sells products from online businesses.

Let us consider the raw materials imports use case for now.

Alice produces a specific grade of steel plate which is used in the construction of vehicles to help keep passengers safe by absorbing engergy in case of a high speed collision.

Alice manufactures these steel plates in Mexico, but imports them to her vehicle factory in Texas.

Bob works for US Customs and reviews import documentation associated with steel shipments from Mexico to the United States.

If steel import documentation is fraudulent, trade agreements cannot be enforced and consumers lives may be at risk.

Alice registers with Bob to be able to automatically provide verifiable credentials associated with steel imports.

Bob's wallet contains (Flow Requirements)[#FlowRequirements] and (Authorized Flows)[#AuthorizedFlows] necessary to validate Alice's steel import documentation automatically.

When Alice needs to ship product to the US, she use the [VP Request Spec](https://w3c-ccg.github.io/vp-request-spec) and the associated [VC HTTP API](https://github.com/w3c-ccg/vc-http-api) endpoints to provide a verifiable presentations of the required credentials to Bob.

Bob is able to use software that automatically verfies that Alice is allowed to submit digital documentation and that the documentation has th required data elements.

Bob's software is also able to flag specifc presentations for further review, even if they meet the specified requirements.

Working together with Bob, Alice is able to quickly import steel into the United States and consumers can able to trust that their cars are constructed from safe ingredients and that trade agreements are being enforced appropriatly for products made inside and outside the United States.

### Defending Against Fraud and Supply Chain Attacks

See [integration.mitm.test.ts](./example/src/__tests__/integration.mitm.test.ts).

In this story, an adversary eve attempts to fraudulently provide import documentation that she intercepted and copied from Alice, but is caught by Bob.

These tests show how verifiable credentials and authorized parties can be combined to prevent fraudulent submission of documentation regarding product imports.

### VC HTTP API Integration

The VC HTTP API defines endpoints compatible with this proposal.

The objects described in this specification are not only way to implement the VC HTTP API.

Many of the objects described here are likely to be dynamically generated in an advanced setting as a result of database queries.

## Alternatives

[DIF Presentation Exchange](https://github.com/decentralized-identity/presentation-exchange)

This spec is overly complicated, we don't need to support any data model except for [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/), so most of the spec's support for arbitrary data models and transports is not useful / harmful to implementers.

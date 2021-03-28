import { walletFactory } from './walletFactory';

const getExportedWallet = async (actor: string) => {
  const wallet = walletFactory.build();
  const seed1 = await wallet.passwordToKey(actor);
  const contents = await wallet.generateContentFromSeed(seed1);
  contents.forEach(c => {
    wallet.add(c);
  });
  const exported = await wallet.export(actor);
  return exported;
};

describe('setup', () => {
  it('alice has a generated wallet', async () => {
    const actor = 'alice';
    const exported = await getExportedWallet(actor);
    expect(exported.id).toBe(
      'did:key:z6LSqNYRQLsCkJMRwdco4tAp4jzHcXEmp2n1dpCrihW73p7A#encrypted-wallet'
    );
  });

  it('bob has a generated wallet', async () => {
    const actor = 'bob';
    const exported = await getExportedWallet(actor);
    expect(exported.id).toBe(
      'did:key:z6LSg1F4BG7jkV41BYK2DdEL9vwEPMFTUuKMod3GwhTBGh2V#encrypted-wallet'
    );
  });

  it('eve has a generated wallet', async () => {
    const actor = 'eve';
    const exported = await getExportedWallet(actor);
    expect(exported.id).toBe(
      'did:key:z6LSpQSGYSJroANQADbCXxETmEtMf7sfitbSa96PfKk1r4jm#encrypted-wallet'
    );
  });
});

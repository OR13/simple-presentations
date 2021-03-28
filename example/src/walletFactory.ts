import * as Factory from 'factory.ts';

import * as Wallet from '@transmute/universal-wallet';
import * as DidKey from '@transmute/universal-wallet-did-key-plugin';
import * as Vc from '@transmute/universal-wallet-vc-plugin';

export interface FastifyWalletFactory
  extends Wallet.Wallet,
    DidKey.DidKeyPlugin,
    Vc.VcPlugin {}

export const walletFactory = Factory.Sync.makeFactory<FastifyWalletFactory>({
  ...Wallet.walletDefaults,
  ...DidKey.factoryDefaults,
  ...Vc.factoryDefaults,
})
  .combine(Wallet.walletFactory)
  .combine(DidKey.pluginFactory)
  .combine(Vc.pluginFactory);

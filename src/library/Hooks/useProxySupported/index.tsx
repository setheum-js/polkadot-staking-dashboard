// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {
  UnsupportedIfUniqueController,
  isSupportedProxyCall,
} from 'config/proxies';
import { useBonded } from 'contexts/Bonded';
import { useConnect } from 'contexts/Connect';
import { useProxies } from 'contexts/Proxies';
import type { AnyApi, AnyJson, MaybeAccount } from 'types';

export const useProxySupported = (from: MaybeAccount) => {
  const { getAccount, activeProxy } = useConnect();
  const { getBondedAccount } = useBonded();
  const { getProxyDelegate } = useProxies();
  const controller = getBondedAccount(from);

  // If call is from controller, & controller is different from stash, then proxy is not
  // supported.
  const controllerNotSupported = (c: string) =>
    UnsupportedIfUniqueController.includes(c) && controller !== from;

  // Determine whether the provided tx is proxy sypported.
  const isProxySupported = (tx: AnyApi) => {
    // if already wrapped, return.
    if (
      tx?.method.toHuman().section === 'proxy' &&
      tx?.method.toHuman().method === 'proxy'
    ) {
      return true;
    }
    // Ledger devices do not support nesting on `proxy.proxy` calls.
    if (getAccount(activeProxy)?.source === 'ledger') {
      return false;
    }

    const proxyDelegate = getProxyDelegate(from, activeProxy);
    const proxyType = proxyDelegate?.proxyType || '';
    const pallet = tx?.method.toHuman().section;
    const method = tx?.method.toHuman().method;
    const call = `${pallet}.${method}`;

    // If a batch call, test if every inner call is a supported proxy call.
    if (call === 'utility.batch') {
      return (tx?.method?.toHuman()?.args?.calls || [])
        .map((c: AnyJson) => ({
          pallet: c.section,
          method: c.method,
        }))
        .every(
          (c: AnyJson) =>
            isSupportedProxyCall(proxyType, c.pallet, c.method) &&
            !controllerNotSupported(`${pallet}.${method}`)
        );
    }

    // Check if the current call is a supported proxy call.
    return (
      isSupportedProxyCall(proxyType, pallet, method) &&
      !controllerNotSupported(call)
    );
  };

  return {
    isProxySupported,
  };
};

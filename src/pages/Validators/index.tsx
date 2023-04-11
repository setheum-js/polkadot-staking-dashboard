// Copyright 2023 @paritytech/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PageRow } from '@polkadotcloud/core-ui';
import { useApi } from 'contexts/Api';
import { useTabs } from 'contexts/Tabs';
import { useValidators } from 'contexts/Validators';
import { CardWrapper } from 'library/Graphs/Wrappers';
import { PageTitle } from 'library/PageTitle';
import { StatBoxList } from 'library/StatBoxList';
import { ValidatorList } from 'library/ValidatorList';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ValidatorFavorites } from './Favorites';
import { ActiveValidatorsStat } from './Stats/ActiveValidators';
import { AverageCommissionStat } from './Stats/AverageCommission';
import { TotalValidatorsStat } from './Stats/TotalValidators';
import { ValidatorsTabsProvider } from './context';

export const ValidatorsInner = () => {
  const { t } = useTranslation('pages');
  const { isReady } = useApi();
  const { validators } = useValidators();
  const { activeTab, setActiveTab } = useTabs();
  const defaultFilters = {
    includes: ['active'],
    excludes: ['all_commission', 'blocked_nominations', 'missing_identity'],
  };

  // back to tab 0 if not in the first tab
  useEffect(() => {
    if (![0].includes(activeTab)) {
      setActiveTab(0);
    }
  }, []);

  let tabs = [
    {
      title: t('validators.validators'),
      active: activeTab === 0,
      onClick: () => setActiveTab(0),
    },
  ];

  tabs = tabs.concat({
    title: t('validators.favorites'),
    active: activeTab === 1,
    onClick: () => setActiveTab(1),
  });

  return (
    <>
      <PageTitle title={t('validators.validators')} tabs={tabs} />
      {activeTab === 0 && (
        <>
          <StatBoxList>
            <ActiveValidatorsStat />
            <TotalValidatorsStat />
            <AverageCommissionStat />
          </StatBoxList>
          <PageRow>
            <CardWrapper>
              {!isReady ? (
                <div className="item">
                  <h3>{t('validators.connecting')}...</h3>
                </div>
              ) : (
                <>
                  {validators.length === 0 && (
                    <div className="item">
                      <h3>{t('validators.fetchingValidators')}...</h3>
                    </div>
                  )}

                  {validators.length > 0 && (
                    <ValidatorList
                      bondFor="nominator"
                      validators={validators}
                      batchKey="validators_browse"
                      title={t('validators.networkValidators')}
                      selectable={false}
                      defaultFilters={defaultFilters}
                      allowMoreCols
                      allowFilters
                      allowSearch
                      pagination
                      toggleFavorites
                    />
                  )}
                </>
              )}
            </CardWrapper>
          </PageRow>
        </>
      )}
      {activeTab === 1 && <ValidatorFavorites />}
    </>
  );
};

export const Validators = () => (
  <ValidatorsTabsProvider>
    <ValidatorsInner />
  </ValidatorsTabsProvider>
);

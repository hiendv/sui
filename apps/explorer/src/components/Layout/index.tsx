// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCookieConsentBanner } from '@mysten/core';
import { SuiClientProvider } from '@mysten/dapp-kit';
import { WalletKitProvider } from '@mysten/wallet-kit';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Fragment } from 'react';
import { resolveValue, Toaster, type ToastType } from 'react-hot-toast';
import { Outlet, ScrollRestoration } from 'react-router-dom';

import { useInitialPageView } from '../../hooks/useInitialPageView';
import { NetworkContext, useNetwork } from '~/context';
import { Banner, type BannerProps } from '~/ui/Banner';
import { persistableStorage } from '~/utils/analytics/amplitude';
import { type Network, NetworkConfigs, createSuiClient } from '~/utils/api/DefaultRpcClient';

const toastVariants: Partial<Record<ToastType, BannerProps['variant']>> = {
	success: 'positive',
	error: 'error',
};

export function Layout() {
	const [network, setNetwork] = useNetwork();

	useCookieConsentBanner(persistableStorage, {
		cookie_name: 'sui_explorer_cookie_consent',
		onBeforeLoad: async () => {
			await import('./cookieConsent.css');
			document.body.classList.add('cookie-consent-theme');
		},
	});

	useInitialPageView(network);

	return (
		// NOTE: We set a top-level key here to force the entire react tree to be re-created when the network changes:
		<Fragment key={network}>
			<ScrollRestoration />
			<WalletKitProvider
				/*autoConnect={false}*/
				enableUnsafeBurner={import.meta.env.DEV}
			>
				<SuiClientProvider
					networks={NetworkConfigs}
					createClient={createSuiClient}
					network={network as Network}
					onNetworkChange={setNetwork}
				>
					<NetworkContext.Provider value={[network, setNetwork]}>
						<Outlet />
						<Toaster
							position="bottom-center"
							gutter={8}
							containerStyle={{
								top: 40,
								left: 40,
								bottom: 40,
								right: 40,
							}}
							toastOptions={{
								duration: 4000,
							}}
						>
							{(toast) => (
								<Banner shadow border variant={toastVariants[toast.type]}>
									{resolveValue(toast.message, toast)}
								</Banner>
							)}
						</Toaster>
						<ReactQueryDevtools />
					</NetworkContext.Provider>
				</SuiClientProvider>
			</WalletKitProvider>
		</Fragment>
	);
}

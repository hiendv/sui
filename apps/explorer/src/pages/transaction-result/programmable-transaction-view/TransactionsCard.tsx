// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { type SuiTransaction } from '@mysten/sui.js/client';

import { Transaction } from './Transaction';
import { ProgrammableTxnBlockCard } from '~/components/transactions/ProgTxnBlockCard';
import { TransactionBlockCardSection } from '~/ui/TransactionBlockCard';

const DEFAULT_ITEMS_TO_SHOW = 5;

interface TransactionsCardProps {
	transactions: SuiTransaction[];
}

export function TransactionsCard({ transactions }: TransactionsCardProps) {
	if (!transactions?.length) {
		return null;
	}

	const expandableItems = transactions.map((transaction, index) => {
		const [[type, data]] = Object.entries(transaction);

		return (
			<TransactionBlockCardSection defaultOpen key={index} title={type}>
				<div data-testid="transactions-card-content">
					<Transaction key={index} type={type} data={data} />
				</div>
			</TransactionBlockCardSection>
		);
	});

	return (
		<ProgrammableTxnBlockCard
			initialClose
			items={expandableItems}
			itemsLabel={transactions.length > 1 ? 'Transactions' : 'Transaction'}
			count={transactions.length}
			defaultItemsToShow={DEFAULT_ITEMS_TO_SHOW}
			noExpandableList={transactions.length < DEFAULT_ITEMS_TO_SHOW}
		/>
	);
}

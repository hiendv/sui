// Copyright (c) Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { type ExportedKeypair } from '@mysten/sui.js/cryptography';
import {
	Account,
	type PasswordUnlockableAccount,
	type SerializedUIAccount,
	type SigningAccount,
	type SerializedAccount,
} from './Account';
import { decrypt, encrypt } from '_src/shared/cryptography/keystore';
import { fromExportedKeypair } from '_src/shared/utils/from-exported-keypair';

type SessionStorageData = { keyPair: ExportedKeypair };
type EncryptedData = { keyPair: ExportedKeypair };

export interface ImportedAccountSerialized extends SerializedAccount {
	type: 'imported';
	encrypted: string;
	publicKey: string;
}

export interface ImportedAccountSerializedUI extends SerializedUIAccount {
	type: 'imported';
	publicKey: string;
}

export function isImportedAccountSerializedUI(
	account: SerializedUIAccount,
): account is ImportedAccountSerializedUI {
	return account.type === 'imported';
}

export class ImportedAccount
	extends Account<ImportedAccountSerialized, SessionStorageData>
	implements PasswordUnlockableAccount, SigningAccount
{
	readonly canSign = true;
	readonly unlockType = 'password' as const;

	static async createNew(inputs: {
		keyPair: ExportedKeypair;
		password: string;
	}): Promise<Omit<ImportedAccountSerialized, 'id'>> {
		const keyPair = fromExportedKeypair(inputs.keyPair);
		const dataToEncrypt: EncryptedData = {
			keyPair: inputs.keyPair,
		};
		return {
			type: 'imported',
			address: keyPair.getPublicKey().toSuiAddress(),
			publicKey: keyPair.getPublicKey().toBase64(),
			encrypted: await encrypt(inputs.password, dataToEncrypt),
			lastUnlockedOn: null,
			selected: false,
		};
	}

	static isOfType(serialized: SerializedAccount): serialized is ImportedAccountSerialized {
		return serialized.type === 'imported';
	}

	constructor({ id, cachedData }: { id: string; cachedData?: ImportedAccountSerialized }) {
		super({ type: 'imported', id, cachedData });
	}

	async lock(allowRead = false): Promise<void> {
		await this.clearEphemeralValue();
		await this.onLocked(allowRead);
	}

	async isLocked(): Promise<boolean> {
		return !(await this.#getKeyPair());
	}

	async toUISerialized(): Promise<ImportedAccountSerializedUI> {
		const { address, publicKey, type, selected } = await this.getStoredData();
		return {
			id: this.id,
			type,
			address,
			publicKey,
			isLocked: await this.isLocked(),
			lastUnlockedOn: await this.lastUnlockedOn,
			selected,
			isPasswordUnlockable: true,
		};
	}

	async passwordUnlock(password: string): Promise<void> {
		const { encrypted } = await this.getStoredData();
		const { keyPair } = await decrypt<EncryptedData>(password, encrypted);
		await this.setEphemeralValue({ keyPair });
		await this.onUnlocked();
	}

	async verifyPassword(password: string): Promise<void> {
		const { encrypted } = await this.getStoredData();
		await decrypt<EncryptedData>(password, encrypted);
	}

	async signData(data: Uint8Array): Promise<string> {
		const keyPair = await this.#getKeyPair();
		if (!keyPair) {
			throw new Error(`Account is locked`);
		}
		return this.generateSignature(data, keyPair);
	}

	async #getKeyPair() {
		const ephemeralData = await this.getEphemeralValue();
		if (ephemeralData) {
			return fromExportedKeypair(ephemeralData.keyPair);
		}
		return null;
	}
}

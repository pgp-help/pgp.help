import { describe, it, expect } from 'vitest';
import { PGPMode, type PGPModeType } from './types.js';

// This is a bit of a noddy test (thanks Claude) but it does help teach me how enums work!

describe('PGPMode enum', () => {
	it('should have correct enum values', () => {
		expect(PGPMode.ENCRYPT).toBe('encrypt');
		expect(PGPMode.DECRYPT).toBe('decrypt');
	});

	it('should work as a type', () => {
		const mode: PGPModeType = PGPMode.ENCRYPT;
		expect(mode).toBe('encrypt');

		const mode2: PGPModeType = PGPMode.DECRYPT;
		expect(mode2).toBe('decrypt');
	});

	it('should be compatible with string literals', () => {
		// This tests that our enum values match the expected string literals
		const encryptMode: string = PGPMode.ENCRYPT;
		const decryptMode: string = PGPMode.DECRYPT;

		expect(encryptMode).toBe('encrypt');
		expect(decryptMode).toBe('decrypt');
	});

	it('should work in switch statements', () => {
		function getModeDescription(mode: PGPModeType): string {
			switch (mode) {
				case PGPMode.ENCRYPT:
					return 'Encryption mode';
				case PGPMode.DECRYPT:
					return 'Decryption mode';
				default:
					return 'Unknown mode';
			}
		}

		expect(getModeDescription(PGPMode.ENCRYPT)).toBe('Encryption mode');
		expect(getModeDescription(PGPMode.DECRYPT)).toBe('Decryption mode');
	});
});

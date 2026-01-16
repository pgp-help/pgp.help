import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/svelte';
import PGPKey from './PGPKey.svelte';
import * as pgp from './pgp';
import * as openpgp from 'openpgp';
import { PersistenceType, keyStore } from './keyStore.svelte';

// Mock the getKeyDetails function to avoid expensive key parsing in UI tests
vi.mock('./pgp', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./pgp')>();
	return {
		...actual,
		getKeyDetails: vi.fn()
	};
});

// Mock keyStore
vi.mock('./keyStore.svelte.js', async (importOriginal) => {
	const actual = await importOriginal<typeof import('./keyStore.svelte.js')>();
	return {
		...actual,
		keyStore: {
			addKey: vi.fn()
		}
	};
});

describe('PGPKey Component', async () => {
	const testKeyArmor = `-----BEGIN PGP PUBLIC KEY BLOCK-----

xsBNBFW7TH8BCADccz73OFQprAsBLNTFNZFTPzDUbmwKn5BMFFK7rYf7v8Gj
PyYQrl9DupBTiP6ISyTIvn/pT0/+G1yTYzliej4UZP7LOUz+pg59/X2JP7Ko
3UzH9qoO3FYXl85ok/daSNRt0VrKSoGcMuoLw7CT48hHZdIXSwoPFP//n8Qo
3u1J3LghZQLPdnZfWHPA6ZKLvcgQaByCABsRrH7L75+Qw49Wb3VeBiE5u26E
j3NXUc1GskMvFHp8pUnfzFxF4sCzk/o+zqJW8NtIje48beufH4eMBF2NK6nF
1Et8ESCM7jE10rpWm+nsl8lMooQEbUXoMp2z2s2zuYmaiV+ONaa3UT6fABEB
AAHNGVBncCBIZWxwIDxoZWxsb0BwZ3AuaGVscD7CwHIEEAEIACYFAlW7TIAG
CwkIBwMCCRAj/Z8+mwZ1aQQVCAIKAxYCAQIbAwIeAQAApGkIAJCtB3PD5aka
rGPzePxmqc37cpOGx/ArO8M7ouXDkc75xt3MOMvAFB4y8lytwteXbLG50Kl0
1KHp1NkUEJM0eR8SxGaPipEgN0PRoEDhN8VgR3m4Lq5RlTMFq1yXQgjPGndB
sP+KIDSfBEPZOlMW9VgdzThjqj8WqVxvaoRPbazLpS+WYrGTx4WjcsoS53ou
b7Fd6rkOdZcbgmUooDHRiNSNJq+RCwZnffxLlJQp3r3U0Ll4Mrsb/pxcOjde
7Cnc1SildK3m5iIuteGSIl8qXXTidcw5vV9w1xDLu7mPztaXlM72KaVkuhJN
/mSaCFTAAgECmvgP88ByG0uDu4SpeFrOwE0EVbtMfwEIAM/+tJfjT8ER4qe0
VJJPCqAcUffyXyABnN4NymDxz97ol9xwi2boTb2oDtTkAXmTU5pKKOjZFtV1
FizpVemVoGWBnmEZBaOUMZy2qFEIHrPh0OWaiuCSr+m/VjvOWota//bJZg1H
/o9JaMXSefE+lWak/BZagMAX/EOWUfzYfNSfHViua5HxKA5PoQ7Blcxt7T1f
5427XhoSpZzdbi9XjlYZmFlQ08MYG18wTVa6g8MJ7qr9TIVZPRnSrtE15iP1
8py3tXn97PToLd78ZkTfnlKZwrMxuFHcNCHMpVbEXD6zVWATeMMNRo5an3kg
dE9+9odr2zZWdJgnN1PDwbGKeEEAEQEAAcLAXwQYAQgAEwUCVbtMgQkQI/2f
PpsGdWkCGwwAAL2qCACSkHd3SDv1XTJJcwsazkXr+NMJaNSN7qQFPMboDS0Z
3pX27Rn1ev1UHTqFKBYgogxyeUOnbeXE+VAFYuoeNCbFYY1TFhvGVWRax/rf
PBuVQ4d1+g87nxSL3JFwvSGzTjPkJiU+rGOIkOqYK0JA/T8+ZqrXTQoH2d7i
r1vldA2CakQ+Mf+BjHjG06doQlrbuGBYXLWJbATpcKmK++kWaGE01h5rFbx8
JmS3SZME1N2bdm99TJVzbWbHqcJge/1lfEY1PecjweX2McXQEVGmZLPdN6dF
HLrZ5SS/qnXSXE79odO4Cd/gx1nJrovmut1vZfxh3yyLOnh9+BZX/NeU9FWu
=MMEa
-----END PGP PUBLIC KEY BLOCK-----`;
	const testKey = await openpgp.readKey({ armoredKey: testKeyArmor });

	const testPrivateKeyArmor = `-----BEGIN PGP PRIVATE KEY BLOCK-----

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
3GjeQvh5mTj+kw==
=6ZGn
-----END PGP PRIVATE KEY BLOCK-----`;
	const testPrivateKey = await openpgp.readKey({ armoredKey: testPrivateKeyArmor });

	it('renders key details widget when valid key is provided', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(testKey as any);

		const { getByText, queryByPlaceholderText } = render(PGPKey, {
			props: {
				keyWrapper: { key: testKey, persisted: PersistenceType.MEMORY }
			}
		});

		// Wait for the async effect to resolve
		await waitFor(() => {
			expect(getByText('Pgp Help <hello@pgp.help>')).toBeTruthy();
		});

		expect(getByText('23fd9f3e9b067569')).toBeTruthy();

		// Click show details to reveal hidden fields
		const showDetailsBtn = getByText('Show more details...');
		await fireEvent.click(showDetailsBtn);

		expect(getByText('1dfa77312bac1781f699e78223fd9f3e9b067569')).toBeTruthy();
		expect(getByText('Public Key')).toBeTruthy();
		expect(getByText('RSAENCRYPTSIGN (2048 bit)')).toBeTruthy();

		// Input should be hidden
		expect(queryByPlaceholderText('Paste PGP Key (Armored)...')).toBeNull();
	});

	it('nudges for decryption when nudgeForDecryption is called', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(testPrivateKey as any);

		const { component, container } = render(PGPKey, {
			props: {
				keyWrapper: { key: testPrivateKey, persisted: PersistenceType.MEMORY }
			}
		});

		await waitFor(() => {
			expect(container.querySelector('.form-control')).toBeTruthy();
		});

		const formControl = container.querySelector('.form-control');
		expect(formControl?.classList.contains('shake')).toBe(false);

		// Call the exported function
		component.nudgeForDecryption();

		// Wait for the class to be applied
		await waitFor(() => {
			expect(formControl?.classList.contains('shake')).toBe(true);
		});

		// Wait for the animation to finish (mocking timers would be better but for simplicity)
		// We can use vi.useFakeTimers() if we want to be precise
	});

	it('copies public key when Copy button is clicked, even for private key', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(testPrivateKey as any);

		// Mock clipboard
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: vi.fn()
			},
			writable: true
		});

		const { getByText } = render(PGPKey, {
			props: {
				keyWrapper: { key: testPrivateKey, persisted: PersistenceType.MEMORY }
			}
		});

		// Click show details to reveal hidden fields
		const showDetailsBtn = getByText('Show more details...');
		await fireEvent.click(showDetailsBtn);

		await waitFor(() => {
			expect(getByText('Private Key')).toBeTruthy();
		});

		// Find the Copy button associated with Show Public Key
		// Since there might be multiple Copy buttons (one for private export), we need to be specific.
		// The structure is: details > summary > MiniActionGroup > Copy Button
		// We can look for the button with label "Copy" that is near "Show Public Key"
		// Or just find all "Copy" buttons and pick the first one, as "Show Public Key" is rendered first.

		const copyButtons = document.querySelectorAll('button[aria-label="Copy"]');
		// Expect at least one
		expect(copyButtons.length).toBeGreaterThan(0);

		// The first one should be the Public Key copy button
		const publicCopyBtn = copyButtons[0];
		await fireEvent.click(publicCopyBtn);

		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testPrivateKey.toPublic().armor());
	});

	it('shows persist button when key is in memory and calls persistKey on click', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(testKey as any);

		const { getByText, getByLabelText } = render(PGPKey, {
			props: {
				keyWrapper: { key: testKey, persisted: PersistenceType.MEMORY }
			}
		});

		await waitFor(() => {
			expect(getByText('Pgp Help <hello@pgp.help>')).toBeTruthy();
		});

		const persistBtn = getByLabelText('Save key');
		expect(persistBtn).toBeTruthy();

		await fireEvent.click(persistBtn);

		expect(keyStore.addKey).toHaveBeenCalledWith(testKey);
	});

	it('does not show persist button when key is already persisted', async () => {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		vi.mocked(pgp.getKeyDetails).mockResolvedValue(testKey as any);

		const { queryByText, getByText } = render(PGPKey, {
			props: {
				keyWrapper: { key: testKey, persisted: PersistenceType.LOCAL_STORAGE }
			}
		});

		await waitFor(() => {
			expect(getByText('Pgp Help <hello@pgp.help>')).toBeTruthy();
		});

		expect(queryByText(/Save To Browser/i)).toBeNull();
	});
});

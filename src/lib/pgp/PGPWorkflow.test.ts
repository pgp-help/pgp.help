/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import * as openpgp from 'openpgp';
import PGPWorkflow from './PGPWorkflow.svelte';
import { keyStore } from './keyStore.svelte';
import { router } from '../router.svelte';

describe('PGPWorkflow', () => {
	let validPublicKey: string;
	let validPrivateKey: string;
	const passphrase = 'password123';

	beforeAll(async () => {
		// Generate a real test key pair
		const { publicKey, privateKey } = await openpgp.generateKey({
			type: 'ecc',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			curve: 'ed25519' as any, //Squash type error
			userIDs: [{ name: 'Test User', email: 'test@example.com' }],
			passphrase
		});
		validPublicKey = publicKey;
		validPrivateKey = privateKey;
	});

	beforeEach(async () => {
		router.openHome();
		await keyStore.clear();
		vi.clearAllMocks();
	});

	it('encrypts message with public key', async () => {
		const user = userEvent.setup();
		render(PGPWorkflow);

		const keyTextarea = screen.getByLabelText(/Public Key/i);
		const messageTextarea = screen.getByLabelText(/^Message/i);
		const outputTextarea = screen.getByLabelText(/Encrypted Message/i);

		await fireEvent.input(keyTextarea, { target: { value: validPublicKey } });

		// Wait for key to be parsed
		const mainArea = screen.getByRole('main', { name: 'PGP Workflow' });
		await within(mainArea).findByText(/Test User/);

		await user.type(messageTextarea, 'Hello World');

		await waitFor(
			() => {
				const output = (outputTextarea as HTMLTextAreaElement).value;
				expect(output).toContain('-----BEGIN PGP MESSAGE-----');
			},
			{ timeout: 5000 }
		);
	});

	it('decrypts message with private key', async () => {
		const user = userEvent.setup();
		render(PGPWorkflow);

		const secretMessage = 'Top Secret Data';
		const encrypted = (await openpgp.encrypt({
			message: await openpgp.createMessage({ text: secretMessage }),
			encryptionKeys: await openpgp.readKey({ armoredKey: validPublicKey })
		})) as string;

		const keyTextarea = screen.getByLabelText(/Public Key/i);

		await fireEvent.input(keyTextarea, { target: { value: validPrivateKey } });

		// Wait for key to be parsed and recognized as private
		await screen.findByText('Private Key', { selector: 'legend' });

		// Unlock
		const passwordInput = await screen.findByLabelText(/Unlock Private Key/i);
		const unlockButton = screen.getByRole('button', { name: /Unlock/i });

		await user.type(passwordInput, passphrase);
		await user.click(unlockButton);

		await screen.findByText((content, element) => {
			return element?.tagName.toLowerCase() === 'span' && content.includes('Unlocked');
		});

		// Switch to decrypt mode
		const decryptButton = screen.getByRole('button', { name: /Decrypt/i });
		await user.click(decryptButton);

		const messageTextarea = screen.getByLabelText(/Encrypted Message/i);
		const outputTextarea = screen.getByLabelText(/Decrypted Message/i);

		await fireEvent.input(messageTextarea, { target: { value: encrypted } });

		await waitFor(
			() => {
				expect(outputTextarea).toHaveValue(secretMessage);
			},
			{ timeout: 5000 }
		);
	});

	it('allows switching modes with private key', async () => {
		const user = userEvent.setup();
		render(PGPWorkflow);

		const keyTextarea = screen.getByLabelText(/Public Key/i);
		await fireEvent.input(keyTextarea, { target: { value: validPrivateKey } });

		await screen.findByText('Private Key', { selector: 'legend' });

		// Unlock
		const passwordInput = await screen.findByLabelText(/Unlock Private Key/i);
		const unlockButton = screen.getByRole('button', { name: /Unlock/i });
		await user.type(passwordInput, passphrase);
		await user.click(unlockButton);
		await screen.findByText((content, element) => {
			return element?.tagName.toLowerCase() === 'span' && content.includes('Unlocked');
		});

		// Default is Encrypt
		expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Encrypted Message/i)).toBeInTheDocument();

		// Switch to Decrypt
		const decryptButton = screen.getByRole('button', { name: /Decrypt/i });
		await user.click(decryptButton);

		expect(screen.getByLabelText(/Encrypted Message/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Decrypted Message/i)).toBeInTheDocument();

		// Switch back to Encrypt
		const encryptButton = screen.getByRole('button', { name: /Encrypt/i });
		await user.click(encryptButton);

		expect(screen.getByLabelText(/^Message/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/Encrypted Message/i)).toBeInTheDocument();
	});

	it('automatically switches to decrypt mode when pasting encrypted message', async () => {
		const user = userEvent.setup();
		render(PGPWorkflow);

		// Encrypt a message
		const secretMessage = 'Auto Switch Test';
		const encrypted = (await openpgp.encrypt({
			message: await openpgp.createMessage({ text: secretMessage }),
			encryptionKeys: await openpgp.readKey({ armoredKey: validPublicKey })
		})) as string;

		const keyTextarea = screen.getByLabelText(/Public Key/i);
		await fireEvent.input(keyTextarea, { target: { value: validPrivateKey } });

		await screen.findByText('Private Key', { selector: 'legend' });

		// Unlock
		const passwordInput = await screen.findByLabelText(/Unlock Private Key/i);
		const unlockButton = screen.getByRole('button', { name: /Unlock/i });
		await user.type(passwordInput, passphrase);
		await user.click(unlockButton);
		await screen.findByText((content, element) => {
			return element?.tagName.toLowerCase() === 'span' && content.includes('Unlocked');
		});

		// Ensure we are in Encrypt mode
		const messageTextarea = screen.getByLabelText(/^Message/i);

		// Paste encrypted message into the "Message" box (which is for plaintext in Encrypt mode)
		await fireEvent.input(messageTextarea, { target: { value: encrypted } });

		// It should detect the armor and switch to Decrypt mode
		// In Decrypt mode, the input label becomes "Encrypted Message" and output "Decrypted Message"

		await waitFor(() => {
			expect(screen.getByLabelText(/Decrypted Message/i)).toBeInTheDocument();
		});

		// And it should decrypt
		const outputTextarea = screen.getByLabelText(/Decrypted Message/i);
		await waitFor(() => {
			expect(outputTextarea).toHaveValue(secretMessage);
		});
	});

	it('should render errors', async () => {
		const user = userEvent.setup();
		render(PGPWorkflow);

		const mainArea = screen.getByRole('main', { name: 'PGP Workflow' });
		const keyTextarea = within(mainArea).getByLabelText(/Public Key/i);
		await fireEvent.input(keyTextarea, { target: { value: validPrivateKey } });
		await screen.findByText('Private Key', { selector: 'legend' });

		const encrypted = `
-----BEGIN PGP MESSAGE-----

wVQDXGUnwVbEXG4ZaWqXPiQ9gKb5HDPBPYUu5e6sUawh+iV/HOaHtXeWZ3sp
CVWmsZfRmSol3WnkpmGHs2fwXxGZEdJMtuOA1O1c97Ir/4L2+UlCSeLSMgF+
ULngoExa449ozHYCiJwbyVvXJWLgSamPDL+yGxunifP7uOyPa0wOGL5c4Ny6
El/w
=vbML
-----END PGP MESSAGE-----`;
		// Ensure we are in Encrypt mode
		const messageTextarea = within(mainArea).getByLabelText(/^Message/i);
		await fireEvent.input(messageTextarea, { target: { value: encrypted } });

		await waitFor(() => {
			expect(screen.getByLabelText(/Decrypted Output/i)).toBeInTheDocument();
		});

		// Find the "Encrypt" button to switch back to Encrypt mode
		const encryptButton = within(mainArea).getByRole('button', { name: /Encrypt/i });
		await user.click(encryptButton);
		await waitFor(() => {
			expect(within(mainArea).getByLabelText(/Encrypted Message/i)).toBeInTheDocument();
		});

		await new Promise((resolve) => setTimeout(resolve, 1000));

		// Check that there's an error because the key is unlocked.
		const textarea = within(mainArea).getByRole('textbox', { name: /encrypted message/i });
		screen.debug(textarea);
		expect(textarea).toHaveAttribute('aria-invalid', 'true');
		expect(textarea).toHaveAccessibleDescription(/Unlock the private key to proceed./i);
	});
});

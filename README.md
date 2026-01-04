# PGP Svelte

A simple, client-side PGP encryption web app built with Svelte and Vite. Encrypt messages using public keys directly in your browser—no server required, ensuring privacy and security.

## Features

- **Client-Side Encryption**: All PGP operations happen locally using OpenPGP.js.
- **Simple Interface**: Clean, responsive UI inspired by pgp.help, with a header, footer, and easy-to-use form.
- **Real-Time Encryption**: Encrypt messages as you type, with live updates.
- **Custom Styling**: Uses Pico CSS with custom overrides for a professional look, including Inter font and a trust-inspired color scheme.
- **Testing**: Comprehensive unit tests with Vitest and Testing Library.
- **Modern Stack**: Built with Svelte 5 (runes), Vite, and TypeScript support.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/pgp-svelte-wsl.git
   cd pgp-svelte-wsl
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Usage

1. **Paste a Public Key**: Enter an armored PGP public key in the "Public Key" field.
2. **Type Your Message**: Input the secret message in the "Message" field.
3. **View Encrypted Output**: The encrypted message appears automatically in the "Encrypted Message" textarea.
4. **Help & Source**: Use the "Help" link in the header for guidance, or view the source on GitHub via the footer.

All encryption is performed client-side—your data never leaves your device.

## Development

### Scripts

- `npm run dev`: Start the development server with hot reloading.
- `npm run build`: Build the app for production.
- `npm run preview`: Preview the production build locally.
- `npm run test`: Run unit tests with Vitest.
- `npm run lint`: Lint the code with ESLint.
- `npm run format`: Format code with Prettier.

### Project Structure

```
src/
├── App.svelte          # Main app component (content)
├── Layout.svelte       # Layout component (header/footer)
├── app.css             # Custom styles and Pico overrides
├── lib/
│   ├── pgp.ts          # PGP encryption logic
│   └── pgp.test.ts     # PGP tests
├── main.js             # App entry point
└── setupTests.js       # Test setup
```

### Technologies

- **Svelte 5**: Reactive UI framework with runes.
- **Vite**: Fast build tool and dev server.
- **Pico CSS**: Minimal CSS framework with custom theming.
- **OpenPGP.js**: JavaScript implementation of PGP.
- **Vitest**: Unit testing framework.
- **ESLint + Prettier**: Code quality and formatting.

## Testing

Run tests with:
```bash
npm test
```

Tests cover PGP functions (encryption, signing/verification) and UI behavior (form rendering, error handling).

## Contributing

1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/your-feature`.
3. Commit changes: `git commit -m 'Add your feature'`.
4. Push to the branch: `git push origin feature/your-feature`.
5. Open a pull request.

Please ensure tests pass and code is linted before submitting.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Links

- [pgp.help](https://pgp.help) - Inspiration for the UI and functionality.
- [OpenPGP.js](https://openpgpjs.org/) - Underlying PGP library.
- [Pico CSS](https://picocss.com/) - CSS framework used.
- [Svelte](https://svelte.dev/) - UI framework.
- [Vite](https://vitejs.dev/) - Build tool.

# pgp.help

A simple, client-side PGP encryption web app built with Svelte and Vite. Encrypt messages using public keys directly in your browser. Data never leaves your browser (the webpage blocks all communication), ensuring privacy and security.

## Features

- **Client-Side Encryption**: All PGP operations happen locally using OpenPGP.js.
- **Simple Interface**: Clean, responsive UI inspired by pgp.help with an easy-to-use form.
- **Modern Stack**: Built with Svelte 5 (runes), Vite, and TypeScript support.
- **Testing**: Comprehensive unit tests with Vitest and Testing Library.

## Usage

1. **Paste a Public Key**: Enter an armored PGP public key in the "Public Key" field.
2. **Type Your Message**: Input the secret message in the "Message" field.
3. **View Encrypted Output**: The encrypted message appears automatically in the "Encrypted Message" textarea.

That's it!

## Contributing / Development

If you're interested in studying / adding features, or just want to lift stuff for your own usage, it's all cool. Please reach out!

I would recomend you use devcontainers to do work here!

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

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Links

- [pgp.help](https://pgp.help) - Inspiration for the UI and functionality.
- [OpenPGP.js](https://openpgpjs.org/) - Underlying PGP library.
- [Pico CSS](https://picocss.com/) - CSS framework used.
- [Svelte](https://svelte.dev/) - UI framework.
- [Vite](https://vitejs.dev/) - Build tool.

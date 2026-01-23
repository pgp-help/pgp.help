# pgp.help

A simple, client-side PGP encryption web app built with Svelte and Vite. Encrypt messages using public keys directly in your browser. Data never leaves your browser (the webpage blocks all communication), ensuring privacy and security.

## ✨ Features

- **Client-Side Encryption**: All PGP and AGE encryption operations happen locally using OpenPGP.js and age-encryption.
- **Multiple Encryption Standards**: Supports both PGP (OpenPGP) and AGE encryption formats.
- **Content Security Policy**: Strict CSP means your browser will prevent any external communication
- **Simple Interface**: Clean, responsive UI inspired by pgp.help with an easy-to-use form.
- **Modern Stack**: Built with Svelte 5 (runes), Vite, and TypeScript support.

## 🚀 Quick Start

1. **Paste a Public Key**: Enter an armored PGP public key in the "Public Key" field.
2. **Type Your Message**: Input the secret message in the "Message" field.
3. **View Encrypted Output**: The encrypted message appears automatically in the "Encrypted Message" textarea.

That's it!

## 🤝 Contributing / Development

If you're interested in studying / adding features, or just want to lift stuff for your own usage, it's all cool. Please reach out!

I would recomend you use devcontainers to do work here!

### 🛠️ Technologies

- **[Svelte 5](https://svelte.dev/)**: Modern reactive UI framework with runes
- **[Vite](https://vitejs.dev/)**: Lightning-fast build tool and dev server
- **[Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)**: Utility-first CSS with beautiful components
- **[OpenPGP.js](https://openpgpjs.org/)**: Pure JavaScript PGP implementation
- **[Vitest](https://vitest.dev/)**: Fast unit testing framework
- **[TypeScript](https://www.typescriptlang.org/)**: Type safety and better developer experience
- **[ESLint](https://eslint.org/) + [Prettier](https://prettier.io/)**: Code quality and consistent formatting

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## 🔗 Links & Inspiration

- [pgp.help](https://pgp.help) - Inspiration for the UI and functionality.
- [OpenPGP.js](https://openpgpjs.org/) - Underlying PGP library.
- [Pico CSS](https://picocss.com/) - CSS framework used.
- [Svelte](https://svelte.dev/) - UI framework.
- [Vite](https://vitejs.dev/) - Build tool.

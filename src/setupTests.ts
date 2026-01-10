import '@testing-library/jest-dom';

// Mock the Web Animations API for Svelte transitions
Object.defineProperty(Element.prototype, 'animate', {
	value: function () {
		return {
			onfinish: null,
			cancel: () => {},
			finish: () => {}
		};
	},
	writable: true
});

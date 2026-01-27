import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import Layout from './Layout.svelte';
import { router } from './routes/router.svelte';

describe('Layout', () => {
	beforeEach(() => {
		// Reset to home before each test
		window.location.hash = '';
		window.location.search = '';
		window.history.replaceState({}, '', '/');
		router.openHome();
	});

	describe('Mobile Sidebar', () => {
		it('renders mobile FAB when hasSidebar is true', () => {
			const { container } = render(Layout, {
				hasSidebar: true,
				sidebar: () => '<div>Test Sidebar</div>',
				children: () => '<div>Test Content</div>'
			});

			// Check for mobile FAB button
			const fab = container.querySelector('.fixed.bottom-6.right-6');
			expect(fab).toBeInTheDocument();
		});

		it('does not render mobile FAB when hasSidebar is false', () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div>Test Sidebar</div>',
				children: () => '<div>Test Content</div>'
			});

			// Check that mobile FAB is not present
			const fab = container.querySelector('.fixed.bottom-6.right-6');
			expect(fab).not.toBeInTheDocument();
		});
	});

	describe('Branding', () => {
		it('renders desktop branding', () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Desktop branding should be present (hidden on mobile, flex on md)
			const desktopBranding = container.querySelector('button.hidden.md\\:flex');
			expect(desktopBranding).toBeInTheDocument();
			expect(desktopBranding).toHaveTextContent('pgp.help');
		});

		it('renders mobile branding', () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Mobile branding should be present (flex on mobile, hidden on md)
			const mobileBranding = container.querySelector('button.md\\:hidden');
			expect(mobileBranding).toBeInTheDocument();
			expect(mobileBranding).toHaveTextContent('pgp.help');
		});

		it('navigates to home when desktop branding is clicked', async () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Click desktop branding
			const desktopBranding = container.querySelector('button.hidden.md\\:flex');
			expect(desktopBranding).toBeInTheDocument();
			await fireEvent.click(desktopBranding);

			// Should navigate to home
			expect(window.location.pathname).toBe('/');
		});

		it('navigates to home when mobile branding is clicked', async () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Click mobile branding
			const mobileBranding = container.querySelector('button.md\\:hidden');
			expect(mobileBranding).toBeInTheDocument();
			await fireEvent.click(mobileBranding);

			// Should navigate to home
			expect(window.location.pathname).toBe('/');
		});
	});

	describe('Guide Link', () => {
		it('renders Guide link on desktop', () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Guide button should be present on desktop (hidden on mobile, flex on md)
			const guideButton = container.querySelector('div.hidden.md\\:flex button');
			expect(guideButton).toBeInTheDocument();
			expect(guideButton).toHaveTextContent('Guide');
		});

		it('navigates to Guide page when Guide button is clicked', async () => {
			const { container } = render(Layout, {
				hasSidebar: false,
				sidebar: () => '<div></div>',
				children: () => '<div>Test Content</div>'
			});

			// Click Guide button
			const guideButton = container.querySelector('div.hidden.md\\:flex button');
			expect(guideButton).toBeInTheDocument();
			await fireEvent.click(guideButton);

			// Should navigate to Guide page
			expect(window.location.pathname).toBe('/Guide');
		});
	});
});

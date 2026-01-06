export const router = $state({
	path: window.location.pathname
});

export function navigate(path: string) {
	window.history.pushState({}, '', path);
	router.path = path;
}

window.addEventListener('popstate', () => {
	router.path = window.location.pathname;
});

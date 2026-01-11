import { mount } from 'svelte';
import './app.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';

import App from './App.svelte';

const app = mount(App, {
	target: document.getElementById('app')!
});

export default app;

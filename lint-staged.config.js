/**
 * lint-staged configuration
 *
 * This runs automatically before each commit (via husky pre-commit hook).
 * It only processes files that are staged for commit, not the entire codebase.
 *
 * For each file pattern:
 * - The key is a glob pattern matching file types
 * - The value is the command(s) to run on matching staged files
 *
 * The --fix flag tells ESLint to auto-fix issues where possible.
 * The --write flag tells Prettier to format and save the files.
 *
 * If any command fails (e.g., unfixable lint errors), the commit is blocked.
 *
 * NOTE: These commands are similar to the "lint" and "format" scripts in package.json,
 * but they serve different purposes:
 * - package.json scripts: Run on the ENTIRE codebase (for manual checks or CI)
 * - lint-staged (here): Run only on STAGED files (for fast pre-commit checks)
 *
 * If you change linting/formatting rules, ensure both places stay consistent.
 */
export default {
	// Run ESLint with auto-fix on JavaScript, TypeScript, and Svelte files
	'*.{js,ts,svelte}': 'eslint --fix',

	// Run Prettier to format these file types
	'*.{js,ts,svelte,css,md,json}': 'prettier --write'
};

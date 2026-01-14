// Redirect for 404.html

const BASE_PATH = import.meta.env.BASE_URL || '/';

sessionStorage.redirect = location.pathname;
console.log('Storing redirect path:', sessionStorage.redirect, ' and redirecting to', BASE_PATH);
location.replace(BASE_PATH);

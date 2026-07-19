import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const login = require('./login.js');

export default async function sparxLogin(credentials) {
    return await login(credentials);
}
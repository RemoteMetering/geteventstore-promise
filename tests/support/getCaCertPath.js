import path from 'path';
import { fileURLToPath } from 'url';
import { version } from './v21.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default (stack) => path.resolve(dirname, version, stack, 'certs', 'ca', 'ca.crt');

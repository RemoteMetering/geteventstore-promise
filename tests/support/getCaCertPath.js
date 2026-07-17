import path from 'path';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default (stack) => {
  const version = process.env.TESTS_V21 === 'true' ? 'v21' : 'lts';
  return path.resolve(dirname, version, stack, 'certs', 'ca', 'ca.crt');
};

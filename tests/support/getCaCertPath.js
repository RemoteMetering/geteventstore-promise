import path from 'path';

export default (stack) => {
	const version = process.env.TESTS_V21 === 'true' ? 'v21' : 'lts';
	return path.resolve(import.meta.dirname, version, stack, 'certs', 'ca', 'ca.crt');
};

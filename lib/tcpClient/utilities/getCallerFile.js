export default function () {
	const originalFunc = Error.prepareStackTrace;

	let callerFile;
	try {
		const err = new Error();
		let currentFile;

		Error.prepareStackTrace = function (err, stack) { return stack; };

		currentFile = err.stack.shift().getFileName();

		while (err.stack.length) {
			callerFile = err.stack.shift().getFileName();
			if (currentFile !== callerFile) break;
		}
	} catch (e) {
		//Do nothing
	}

	Error.prepareStackTrace = originalFunc;

	return callerFile;
}
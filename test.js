const EventStore = require('./index');

const client = new EventStore.TCPClient({
	hostname: '192.168.50.21',
	port: 1113,
	credentials: {
		username: 'admin',
		password: 'changeit'
	},
	poolOptions: {
		min: 0,
		max: 10
	}
});

(async function () {
	for (;;) {
		const subscription = await client.subscribeToStreamFrom('File-07f8f6c0-1ad4-4000-be57-c8af4675cef9', 0, () => {});
		// (await client.getPool()).clear();
		await subscription.close();
		const memory = process.memoryUsage();
		console.log(`Memory used ${memory.heapUsed}`);
	}
})();
import { EventStoreDBClient } from "@eventstore/db-client";
import debugModule from 'debug';

const debug = debugModule('geteventstore:connectionManager');

export default {
	async create(config) {
		console.log("config.baseUrl ", config.baseUrl);
		console.log("`${config.baseUrl}?tls=false` ", `${config.baseUrl}?tls=false`);
		return EventStoreDBClient.connectionString(`${config.baseUrl}?tls=false`);
	},
};
export default {
	vhosts: {
		'/': {
			connection: {
				heartbeat: 10,
				socketOptions: {
					timeout: 1000
				}
			},
			exchanges: ['boundless_ex'],
			queues: ['boundless_q'],
			bindings: [
				'boundless_ex[msg] -> boundless_q'
			],
			publications: {
				boundless_pub: {
					exchange: 'boundless_ex',
					routingKey: 'msg'
				}
			},
			subscriptions: {
				boundless_sub: {
					queue: 'boundless_q',
					prefetch: 10,
					contentType: 'application/json'
				}
			}
		}
	}
};

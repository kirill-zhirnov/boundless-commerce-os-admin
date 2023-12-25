// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const _ = require('underscore');
const pathAlias = require('path-alias');
const providerFactory = pathAlias('@p-orders/modules/sms/factory');
const mustacheCompiler = pathAlias('@p-system/modules/mustacheCompiler');

class SmsSender {
	constructor(db, lang) {
		this.db = db;
		this.lang = lang;
		this.provider = null;
	}

	send(recipient, message) {
		return this.getProvider().send(recipient, message);
	}

	sendByEventAlias(alias, data) {
		const deferred = Q.defer();

		this.loadEvent(alias, data.order_status_id)
		.then(event => {
			if (!event) {
				return;
			} else {
				return this.sendByEventRow(event, data);
			}
	}).then(() => {
			return deferred.resolve();
			}).catch(e => {
			return deferred.reject(e);
		}).done();

		return deferred.promise;
	}

	sendByEventRow(eventRow, data) {
		const deferred = Q.defer();

		this.loadProvider()
		.then(() => {
			data.template = eventRow.template;
			data.event_id = eventRow.event_id;
			return this.sendByData(data);
	}).then(() => {
			return deferred.resolve();
		}).catch(e => {
			return deferred.reject(e);
		}).done();

		return deferred.promise;
	}

	sendByData(data) {
		const deferred = Q.defer();

		Q()
		.then(() => {
			if (data.message) {
				return data.message;
			} else if (data.template) {
				return this.compileTemplate(data.template, _.omit(data, [
					'order_status_id',
					'recipient',
					'message',
					'person_id',
					'event_id'
				])
				);
			} else {
				throw new Error('No message or message template');
			}
	}).then(message => {
			data.message = message;

			if (!data.recipient) {
				throw new Error('No recipient to send to');
			}

			return this.send(data.recipient, data.message);
			}).then(() => {
			return this.log(data);
		}).then(() => {
			return deferred.resolve();
		}).catch(e => {
			return this.log(data, e)
			.then(() => {
				return deferred.reject(e);
		}).done();
		}).done();

		return deferred.resolve();
	}

	loadProvider(alias) {
		if (alias == null) { alias = 'smspilot'; }
		const currentProvider = this.getProvider();

		if (currentProvider && (currentProvider.getAlias() === alias)) {
			return Q(currentProvider);
		}

		const deferred = Q.defer();

		this.loadProviderRow(alias)
		.then(row => {
			if (row) {
				this.setProvider(providerFactory.createProvider(row, this.getLang()));
			} else {
				this.setProvider(null);
			}

			return deferred.resolve(this.getProvider());
	}).done();

		return deferred.promise;
	}

	loadProviderRow(alias) {
		const deferred = Q.defer();

		this.getDb().sql(`\
select \
* \
from \
sms_service \
inner join sms_provider using(provider_id) \
where \
alias = :alias\
`, {
			alias
		})
		.then(rows => {
			return deferred.resolve(rows[0]);
	})
		.done();

		return deferred.promise;
	}

	loadEvent(alias, statusId = null) {
		const deferred = Q.defer();

		this.getDb().sql(`\
select \
* \
from \
sms_event \
left join sms_template using (event_id) \
where \
sms_event.alias = :alias \
and sms_template.lang_id = :lang \
and sms_event.deleted_at is null \
${statusId ? 'and order_status_id = :status' : ''}\
`, {
			alias,
			status: statusId,
			lang: this.getLang().lang_id
		})
		.then(rows => {
			return deferred.resolve(rows[0]);
	})
		.done();

		return deferred.promise;
	}

	log(data, error = null) {
		if (!this.getProvider()) {
			return Q();
		}

		const deferred = Q.defer();

		if (!error) {
			data.status = 'success';
		} else {
			data.status = 'error';
			data.error = error;
		}

		data.service_id = this.getProvider().getServiceId();

		Q(this.getDb().model('smsLog').create(data))
		.then(() => {
			return deferred.resolve();
	}).done();

		return deferred.promise;
	}

	compileTemplate(template, data) {
		return mustacheCompiler.compile(template, data);
	}

	getProvider() {
		return this.provider;
	}

	setProvider(provider) {
		this.provider = provider;
	}

	getLang() {
		return this.lang;
	}

	getDb() {
		return this.db;
	}
}

module.exports = SmsSender;
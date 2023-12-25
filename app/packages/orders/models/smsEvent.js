import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
import SmsSender from '../modules/smsSender';

export default function (sequelize, DataTypes) {
	class SmsEvent extends ExtendedModel {
		static sendByEventAlias(eventAlias, instanceRegistry, additionalData) {
			const deferred = Q.defer();

			instanceRegistry.getSettings().get('orders', 'smsNotifications')
				.then(shouldSend => {
					if (shouldSend) {
						switch (eventAlias) {
							case 'order_status_change':
								var {orderId, clientRegistry, orderStatusId} = additionalData;
								return this.sendOrderStatusChange(orderId, orderStatusId, clientRegistry);
							default:
								return;
						}
					}
				}).then(() => {
					return deferred.resolve();
				}).catch(e => {
					console.error(e);
					return deferred.resolve();
				}).done();

			return deferred.promise;
		}

		static sendOrderStatusChange(orderId, orderStatusId, clientRegistry) {
			return this.loadOrderStatusChangeData(orderId, clientRegistry.getLocale())
				.then(data => {
					if (data.recipient) {
						data.order_status_id = orderStatusId;

						// FIXME закомментировано из-за ошибок в импортах зависимых модулей.
						// const smsSender = new SmsSender(this.sequelize, clientRegistry.getLang());
						// return smsSender.sendByEventAlias('order_status_change', data);
					}
				}).then(() => {
				});
		}

		static loadOrderStatusChangeData(orderId, locale, trx = null) {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
orders.*, \
phone.*, \
tn.track_number \
from \
orders \
left join phone on orders.customer_id = phone.person_id and phone.is_default_for_sms = true \
left join ( \
select \
track_number.order_id, \
string_agg(track_number, \', \') as track_number \
from \
track_number \
left join parcel using(track_number_id) \
where \
track_number.order_id = :order \
and parcel.deleted_at is null \
group by \
track_number.order_id \
) tn using (order_id) \
where \
orders.order_id = :order\
', {
				order: orderId
			}, {
				transaction: trx
			})
				.then(rows => {
					//@ts-ignore
					const {phone, customer_id, total_price, track_number} = rows[0];
					return deferred.resolve({
						recipient: phone,
						person_id: customer_id,
						ORDER_ID: orderId,
						ORDER_SUM: locale.formatMoney(total_price),
						TRACK_NUM: track_number || ''
					});
				});

			return deferred.promise;
		}

		static getFakeData(locale) {
			return {
				ORDER_ID: 1,
				ORDER_SUM: locale.formatMoney(1200),
				TRACK_NUM: 'AAABBB'
			};
		}
	}

	SmsEvent.init({
		event_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.ENUM('order_status_change')
		},

		order_status_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'sms_event',
		deletedAt: 'deleted_at',
		modelName: 'smsEvent',
		sequelize
	});

	return SmsEvent;
}
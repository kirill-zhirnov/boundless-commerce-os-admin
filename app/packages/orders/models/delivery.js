import ExtendedModel from '../../../modules/db/model';
import _ from 'underscore';

export default function (sequelize, DataTypes) {
	class Delivery extends ExtendedModel {
		static async findOptions(langId, siteId, out = []) {
			const rows = await this.sequelize.sql(`
				select
					delivery_id,
					title,
					shipping_config
				from
					delivery
					inner join delivery_text using(delivery_id)
					inner join delivery_site using(delivery_id)
				where
					lang_id = :lang
					and site_id = :site
					and deleted_at is null
				order by sort asc
			`, {
				lang: langId,
				site: siteId
			});

			for (const row of rows) {
				const data = {};

				//@ts-ignore
				if (row.shipping_config && row.shipping_config.price) {
					//@ts-ignore
					data.price = row.shipping_config.price;
				}

				//@ts-ignore
				out.push([row.delivery_id, row.title, data]);
			}

			return out;
		}

		static async findByAliasAndSite(alias, siteId, langId) {
			const [row] = await this.sequelize.sql(`
				select
					*
				from
					delivery
				inner join delivery_text using(delivery_id)
				inner join delivery_site using(delivery_id)
				inner join vw_shipping on
					vw_shipping.shipping_id = delivery.shipping_id
					and vw_shipping.lang_id = delivery_text.lang_id
					and vw_shipping.alias = :alias
				where
					site_id = :site
					and delivery_text.lang_id = :lang
					and delivery.deleted_at is null
				order by
					sort asc
			`, {
				alias,
				lang: langId,
				site: siteId
			});

			return row;
		}

		static async deleteDemoApi(trx = null) {
			const shipping = {};
			const rows = await this.sequelize.sql(`
				select * from shipping where alias in (
					'rusSnailMail', 'edostCalc', 'boxBerry'
				)
			`);

			for (const row of rows) {
				//@ts-ignore
				shipping[row.alias] = row;
			}

			if (!Object.keys(shipping).length) return;

			await this.sequelize.sql(`
				delete from delivery
				where
					(
						shipping_id = :rusSnailMailId
						and shipping_config @> :demoEdostConf
					)
				or
					(
						shipping_id = :boxBerryId
						and shipping_config @> :demoBoxBerryConf
					)
				or
					(
						location_shipping_id = :edostCalcId
						and shipping_config @> :demoEdostConf
					)
			`, {
				rusSnailMailId: shipping.rusSnailMail.shipping_id,
				edostCalcId: shipping.edostCalc.shipping_id,
				demoEdostConf: JSON.stringify({
					edost: {
						id: shipping.edostCalc.settings.demo.id
					}
				}),
				boxBerryId: shipping.boxBerry.shipping_id,
				demoBoxBerryConf: JSON.stringify({
					apiToken: shipping.boxBerry.settings.system.apiToken
				})
			}, {
				transaction: trx
			});
		}

		static async loadAvailableDelivery(instanceRegistry, siteId, langId, i18n, ordersSum = 0) {
			const checkoutPageSettings = await instanceRegistry.getSettings().get('orders', 'checkoutPage');

			const rows = await this.sequelize.sql(`
				select
					delivery_id,
					shipping_config,
					delivery_text.title,
					delivery_text.description,
					vw_shipping.alias,
					delivery.calc_method,
					delivery.free_shipping_from,
					delivery.img
				from
					delivery
				inner join delivery_text using(delivery_id)
				inner join delivery_site using(delivery_id)
				left join vw_shipping on
					vw_shipping.shipping_id = delivery.shipping_id
					and vw_shipping.lang_id = delivery_text.lang_id
				where
					site_id = :site
					and delivery_text.lang_id = :lang
					and delivery.status = 'published'
					and delivery.deleted_at is null
				order by
					sort asc
			`, {
				site: siteId,
				lang: langId
			});

			const out = {
				russianPostDelivery: null,
				selfPickupDelivery: null,
				shippingTypeOptions: [],
				courierDelivery: null
			};

			let hasShippingByLocation = false;
			const availableCargoServices = [];

			for (let row of Array.from(rows)) {
				//@ts-ignore
				switch (row.calc_method) {
					case 'byShippingService': case 'byEdost': case 'byOwnRates':
						//@ts-ignore
						switch (row.alias) {
							case 'rusSnailMail':
								out.russianPostDelivery = row;
								hasShippingByLocation = true;
								availableCargoServices.push(_.pick(row, ['title', 'alias']));
								break;

							case 'selfPickup':
								out.selfPickupDelivery = row;

								//@ts-ignore
								out.shippingTypeOptions.push([row.delivery_id, row.title, {
									//@ts-ignore
									alias: row.alias,
									//@ts-ignore
									description: row.shipping_config.address
								}]);
								break;
							default:
								if (!out.courierDelivery) {
									out.courierDelivery = [];
								}

								out.courierDelivery.push(row);
								hasShippingByLocation = true;
								availableCargoServices.push(_.pick(row, ['title', 'alias']));
						}
						break;

					case 'single':
						//@ts-ignore
						out.shippingTypeOptions.push([row.delivery_id, row.title, {
							//@ts-ignore
							price: this.checkFreeShipping(ordersSum, row, row.shipping_config.price),
							//@ts-ignore
							description: row.description,
							//@ts-ignore
							img: row.img
						}]);
						break;
				}
			}

			if (hasShippingByLocation) {
				let shippingByLocationLabel = i18n.__('Courier, snail mail or to the point of self-export');
				if (checkoutPageSettings.labelShippingByLocation) {
					shippingByLocationLabel = checkoutPageSettings.labelShippingByLocation;
				}

				out.shippingTypeOptions.push(['shippingByLocation', shippingByLocationLabel, {
					alias: 'shippingByLocation',
					cargoServices: availableCargoServices
				}]);
			}

			return out;
		}

		static checkFreeShipping(orderSum, deliveryRow, payRate) {
			if (deliveryRow.free_shipping_from && (Number(deliveryRow.free_shipping_from) <= Number(orderSum))) {
				return 0;
			} else {
				return payRate;
			}
		}

		static getIdForForm(id, type = null) {
			switch (type) {
				case 'pickupPoint':
					return `${id}.pickupPoint`;

				default:
					return String(id);
			}
		}
	}

	Delivery.init({
		delivery_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT,
			allowNull: true
		},

		calc_method: {
			type: DataTypes.ENUM('byShippingService', 'byEdost', 'byOwnRates', 'single'),
			allowNull: true
		},

		shipping_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		shipping_config: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		location_shipping_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		free_shipping_from: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		img: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		tax: {
			type: DataTypes.STRING(30),
			allowNull: true
		},

		mark_up: {
			type: DataTypes.STRING(255),
			allowNull: true
		},

		status: {
			type: DataTypes.ENUM('draft', 'published', 'hidden')
		},

		created_by: {
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
		tableName: 'delivery',
		deletedAt: 'deleted_at',
		modelName: 'delivery',
		sequelize
	});

	return Delivery;
}
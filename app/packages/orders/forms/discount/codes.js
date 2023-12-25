import Form from '../../../../modules/form/index';
import _ from 'underscore';
import validator from '../../../../modules/validator/validator';
import {Op} from 'sequelize';

export default class CodesForm extends Form {
	constructor(options) {
		super(options);

		this.validCodes = [];
	}

	getRules() {
		return [
			[
				'title, codes, discount_type, discount_value',
				'required'
			],
			['codes', 'validateCodes'],
			['discount_type', 'inOptions', {options: 'type'}],
			['discount_value', 'isDotNumeric'],
			['single_per_customer', 'safe'],
			['limit_type_usage', 'inOptions', {options: 'limitUsageType'}],
			['min_order_amount', 'isDotNumeric'],
			['discount_value', 'validateDiscountValue']
		];
	}

	loadRecord() {
		return this.getModel('couponCampaign').findException({
			include: [
				{
					model: this.getModel('couponCode')
				}
			],
			where: {
				campaign_id: this.pk
			}
		});
	}

	setupAttrsByRecord() {
		this.setAttributes(this.record.toJSON());

		this.attributes.single_per_customer = this.record.limit_usage_per_customer > 0
			? '1' : null
			;
		this.attributes.limit_type_usage = this.record.limit_usage_per_code == 1
			? 'single' : 'reusable'
			;

		let codes = [];
		this.record.couponCodes.forEach((row) => {
			codes.push(row.code);
		});

		this.attributes.codes = codes.join('\n');
	}

	getDefaultAttrs() {
		return {
			discount_type: 'percent',
			limit_type_usage: 'reusable'
		};
	}

	async getTplData() {
		if (!this.record)
			return super.getTplData();

		const out = await super.getTplData();
		const statistics = await this.loadStatistics();
		out.statistics = statistics;

		return out;
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const row = await this.getRecord() || this.getModel('couponCampaign').build();

		row.set(_.pick(attrs, [
			'title',
			'discount_type',
			'discount_value',
			'min_order_amount'
		]));

		row.limit_usage_per_customer = attrs.single_per_customer == '1'
			? 1 : null;
		row.limit_usage_per_code = attrs.limit_type_usage == 'single'
			? 1 : null;

		this.record = row;
		await row.save();
		await this.saveCodes();
	}

	rawOptions() {
		return {
			type: this.getModel('couponCampaign').getDiscountTypeOptions(this.getI18n()),
			limitUsageType: this.getModel('couponCampaign').getLimitTypeOptions(this.getI18n())
		};
	}

	async validateCodes(value) {
		this.validCodes = [];

		if (this.hasErrors('codes'))
			return;

		const splitCodes = String(value).split(/\r\n|\r|\n/);
		let duplicateFound = false;

		for (let code of splitCodes) {
			code = validator.trim(code);

			if (!code.length || duplicateFound)
				continue;

			const anotherCode = await this.getModel('couponCode').findOne({
				where: {
					code: code,
					campaign_id: {
						[Op.ne]: this.record ? this.record.campaign_id : 0
					}
				}
			});

			if (anotherCode) {
				duplicateFound = true;
				this.addError('codes', 'duplicate', this.getI18n().__('Coupon code "%s" is already used.', [code]));
			} else {
				this.validCodes.push(code);
			}
		}

		if (this.hasErrors('codes'))
			return;

		if (!this.validCodes.length) {
			this.addError('codes', 'required', this.getI18n().__('Value cannot be blank.'));
			return;
		}

		if (this.validCodes.length > 1000) {
			this.addError('codes', 'tooMuch', this.getI18n().__('Too many promo codes. Max is %s', [1000]));
			return;
		}
	}

	async saveCodes() {
		for (const code of this.validCodes) {
			await this.getDb().sql(`
				insert into coupon_code
					(campaign_id, code)
				values
					(:campaign, :code)
				on conflict do nothing
			`, {
				campaign: this.record.campaign_id,
				code: code
			});

		}

		await this.deleteOutdatedCodes();
	}

	/**
	 * this.validCodes - might be so long list, so it isn't possible to delete outdated
	 * with single query "not in (valid, codes)"
	 *
	 * @returns {*}
	 */
	async deleteOutdatedCodes() {
		const rows = await this.getDb().sql(`
			select code_id, code from coupon_code where campaign_id = :campaign
		`, {
			campaign: this.record.campaign_id
		});

		for (const row of rows) {
			if (this.validCodes.indexOf(row.code) == -1) {
				await this.getModel('couponCode').destroy({
					where: {
						code_id: row.code_id
					}
				});
			}
		}
	}

	validateDiscountValue(value) {
		if (this.hasErrors('discount_value'))
			return;

		value *= 1;
		if (this.attributes.discount_type == 'percent') {
			if (value < 0 || value > 100) {
				this.addError('discount_value', 'outOfRange', this.getI18n().__('Should be in %s and %s', [0, 100]));
				return;
			}
		}

		if (this.attributes.discount_type == 'fixed') {
			if (value < 0) {
				this.addError('discount_value', 'outOfRange', this.getI18n().__('Value should be greater than %s', [0]));
				return;
			}
		}
	}

	async loadStatistics() {
		const statByStatuses = await this.statisticsByStatuses();
		const statuses = await this.getModel('orderStatus').loadAvailable();

		return {
			statByStatuses,
			statuses
		};
	}

	async statisticsByStatuses() {
		const rows = await this.getDb().sql(`
			select
				status_id,
				count(order_id) as total_orders,
				count(distinct customer_id) as total_customers,
				coalesce(sum(orders.total_price), 0) as sum_price,
				coalesce(sum(orders.discount_for_order), 0) as sum_discount
			from
				coupon_code
				left join order_discount using(code_id)
				left join orders using(order_id)
				left join order_status using(status_id)
			where
				campaign_id = :campaign
			group by
				status_id
		`, {
			campaign: this.record.campaign_id
		});
		const out = {};

		rows.forEach((row) => {
			out[row.status_id] = row;
		});

		return out;
	}
}
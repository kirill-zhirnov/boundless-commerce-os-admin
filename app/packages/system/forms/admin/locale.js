import Form from '../../../../modules/form/index';

export default class LocaleForm extends Form {
	getRules() {
		return [
			[
				`currency_alias, currency_symbol, money_format, money_precision,
				phone_mask, phone_placeholder`,
				'required'
			],
			['currency_alias', 'inOptions', {options: 'currency'}],
			['currency_symbol, money_format, phone_mask, phone_placeholder', 'trim'],
			['money_format', 'validateMoneyFormat'],
			['money_decimal, money_thousand', 'inOptions', {options: 'separator'}],
			['money_precision', 'inOptions', {options: 'precision'}],
		];
	}

	async save() {
		await this.saveCurrency();

		const attrs = this.getSafeAttrs();
		//@ts-ignore
		const {money_decimal, money_thousand, money_precision, money_format, currency_symbol, phone_mask, phone_placeholder} = attrs;
		const newLocaleVal = {
			money: {
				decimal: money_decimal,
				thousand: money_thousand,
				precision: money_precision,
				format: money_format,
				symbol: currency_symbol
			},
			phone: {
				mask: phone_mask,
				placeholder: phone_placeholder,
			}
		};

		const localeVal = await this.getSetting('system', 'locale');
		Object.assign(localeVal, newLocaleVal);

		await this.setSetting('system', 'locale', localeVal);
	}

	async setupAttrs() {
		const attrs = {};

		const currency = await this.getSetting('system', 'currency');
		Object.assign(attrs, {
			//@ts-ignore
			currency_alias: currency.alias,
		});

		const locale = await this.getSetting('system', 'locale');
		Object.assign(attrs, {
			//@ts-ignore
			currency_symbol: locale.money.symbol,
			//@ts-ignore
			money_format: locale.money.format,
			//@ts-ignore
			money_decimal: locale.money.decimal,
			//@ts-ignore
			money_thousand: locale.money.thousand,
			//@ts-ignore
			money_precision: locale.money.precision,
			//@ts-ignore
			phone_mask: locale.phone.mask,
			//@ts-ignore
			phone_placeholder: locale.phone.placeholder
		});

		this.setAttributes(attrs);
	}

	async saveCurrency() {
		const attrs = this.getSafeAttrs();
		const currency = {
			//@ts-ignore
			alias: attrs.currency_alias
		};
		let trx;

		//@ts-ignore
		const currencyRow = await this.getModel('currency').findException({
			where: {
				alias: currency.alias
			}
		});

		//update currency_id in all related tables under transaction
		try {
			trx = await this.getDb().transaction({autocommit: false});

			await this.getDb().sql('update final_price set currency_id = :newId', {
				newId: currencyRow.currency_id
			}, {
				transaction: trx
			});
			await this.getDb().sql('update inventory_price set currency_id = :newId', {
				newId: currencyRow.currency_id
			}, {
				transaction: trx
			});

			await this.getDb().sql(`
				update
					setting
				set
					value = :value
				where
					setting_group = 'system'
					and key = 'currency'
			`, {
				value: JSON.stringify(currency)
			}, {
				transaction: trx
			});

			await trx.commit();
			trx = null;

			await this.getInstanceRegistry().getSettings().clearCache('system', 'currency');
		} catch (e) {
			if (trx) {
				await trx.rollback();
			}

			throw e;
		}
	}

	rawOptions() {
		return {
			//@ts-ignore
			currency: this.getModel('currency').loadOptions(this.getI18n(), [['', this.__('Select')]]),
			separator: [
				['', this.__('No')],
				[' ', this.__('Space')],
				['.', '.'],
				[',', ','],
			],
			precision: [
				['0', '0'],
				['1', '1'],
				['2', '2'],
				['3', '3']
			]
		};
	}

	async getTplData() {
		const data = await super.getTplData();
		//@ts-ignore
		data.currencySymbols = this.getCurrencySymbols();

		return data;
	}

	getCurrencySymbols() {
		return {
			rub: '₽',
			byn: '₽',
			eur: '€',
			usd: '$',
			uah: '₴',
			kzt: '₸',
			azn: '₼',
			amd: '֏',
			kgs: 'с',
			mdl: 'L',
			tjs: 'с.',
			uzs: 'so’m',
			gbp: '£'
		};
	}

	validateMoneyFormat(value) {
		if (String(value).length > 20) {
			this.addError('money_format', 'wrongFormat', 'Max length is 20');
			return;
		}
	}
}
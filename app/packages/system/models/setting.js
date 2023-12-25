import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Setting extends ExtendedModel {
		static getVatOptions(i18n) {
			return [
				['noVat', i18n.__('Without VAT')],
				['vat0', i18n.__('0% VAT')],
				['vat10Receipt', i18n.__('10% receipt VAT')],
				['vat18Receipt', i18n.__('18% receipt VAT')],
				['vat20Receipt', i18n.__('20% receipt VAT')],
				['vat10/110', i18n.__('10/110 VAT')],
				['vat18/118', i18n.__('18/118 VAT')],
				['vat20/120', i18n.__('20/120 VAT')],
			];
		}

		static preloadSetting() { }


		static getPaymentSubjectTypeOptions(i18n) {
			return [
				['commodity', i18n.p__('onlineReceipt', 'Commodity')],
				['excise', i18n.p__('onlineReceipt', 'Excise')],
				['job', i18n.p__('onlineReceipt', 'Job')],
				['service', i18n.p__('onlineReceipt', 'Service')],
				['gambling_bet', i18n.p__('onlineReceipt', 'Gambling bet')],
				['gambling_prize', i18n.p__('onlineReceipt', 'Gambling prize')],
				['lottery', i18n.p__('onlineReceipt', 'Lottery')],
				['lottery_prize', i18n.p__('onlineReceipt', 'Lottery prize')],
				['intellectual_activity', i18n.p__('onlineReceipt', 'Intellectual activity')],
				['payment', i18n.p__('onlineReceipt', 'Payment')],
				['agent_commission', i18n.p__('onlineReceipt', 'Agent commission')],
				['composite', i18n.p__('onlineReceipt', 'Composite')],
				['another', i18n.p__('onlineReceipt', 'Another')],
			];
		}

		static getPaymentMethodTypeOptions() {
			return [
				['full_prepayment', 'full_prepayment'],
				['partial_prepayment', 'partial_prepayment'],
				['advance', 'advance'],
				['full_payment', 'full_payment'],
				['partial_payment', 'partial_payment'],
				['credit', 'credit'],
				['credit_payment', 'credit_payment'],
			];
		}
	}

	Setting.init({
		setting_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		setting_group: {
			type: DataTypes.TEXT
		},

		key: {
			type: DataTypes.TEXT
		},

		value: {
			type: DataTypes.JSON
		}
	}, {
		tableName: 'setting',
		modelName: 'setting',
		sequelize
	});

	return Setting;
}

// module.exports = (sequelize, DataTypes) => sequelize.define('setting', {
// 	setting_id: {
// 		type: DataTypes.INTEGER,
// 		primaryKey: true,
// 		autoIncrement: true
// 	},

// 	setting_group: {
// 		type: DataTypes.TEXT
// 	},

// 	key: {
// 		type: DataTypes.TEXT
// 	},

// 	value: {
// 		type: DataTypes.JSON
// 	}

// }, {
// 	tableName: 'setting',
// 	classMethods: {
// 		getVatOptions(i18n) {
// 			return [
// 				['noVat', i18n.__('Without VAT')],
// 				['vat0', i18n.__('0% VAT')],
// 				['vat10Receipt', i18n.__('10% receipt VAT')],
// 				['vat18Receipt', i18n.__('18% receipt VAT')],
// 				['vat20Receipt', i18n.__('20% receipt VAT')],
// 				['vat10/110', i18n.__('10/110 VAT')],
// 				['vat18/118', i18n.__('18/118 VAT')],
// 				['vat20/120', i18n.__('20/120 VAT')],
// 			];
// 		},

// 		preloadSetting() { },


// 		getPaymentSubjectTypeOptions(i18n) {
// 			return [
// 				['commodity', i18n.p__('onlineReceipt', 'Commodity')],
// 				['excise', i18n.p__('onlineReceipt', 'Excise')],
// 				['job', i18n.p__('onlineReceipt', 'Job')],
// 				['service', i18n.p__('onlineReceipt', 'Service')],
// 				['gambling_bet', i18n.p__('onlineReceipt', 'Gambling bet')],
// 				['gambling_prize', i18n.p__('onlineReceipt', 'Gambling prize')],
// 				['lottery', i18n.p__('onlineReceipt', 'Lottery')],
// 				['lottery_prize', i18n.p__('onlineReceipt', 'Lottery prize')],
// 				['intellectual_activity', i18n.p__('onlineReceipt', 'Intellectual activity')],
// 				['payment', i18n.p__('onlineReceipt', 'Payment')],
// 				['agent_commission', i18n.p__('onlineReceipt', 'Agent commission')],
// 				['composite', i18n.p__('onlineReceipt', 'Composite')],
// 				['another', i18n.p__('onlineReceipt', 'Another')],
// 			];
// 		},

// 		getPaymentMethodTypeOptions() {
// 			return [
// 				['full_prepayment', 'full_prepayment'],
// 				['partial_prepayment', 'partial_prepayment'],
// 				['advance', 'advance'],
// 				['full_payment', 'full_payment'],
// 				['partial_payment', 'partial_payment'],
// 				['credit', 'credit'],
// 				['credit_payment', 'credit_payment'],
// 			];
// 		}
// 	}
// });
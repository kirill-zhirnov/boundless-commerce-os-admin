import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class SiteCountryLang extends ExtendedModel {
	}

	SiteCountryLang.init({
		site_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		country_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		lang_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		is_default: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'site_country_lang',
		modelName: 'siteCountryLang',
		sequelize
	});

	return SiteCountryLang;
}
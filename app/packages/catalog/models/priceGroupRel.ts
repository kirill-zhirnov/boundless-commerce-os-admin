import ExtendedModel from '../../../modules/db/model';
import {IPriceGroupRel} from '../../../@types/catalog';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class PriceGroupRel extends ExtendedModel {

	}

	PriceGroupRel.init({
		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
		group_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
		},
	}, {
		tableName: 'price_group_rel',
		modelName: 'priceGroupRel',
		sequelize
	});
}

export interface IPriceGroupRelModel extends ExtendedModel, IPriceGroupRel {
}

export type IPriceGroupRelModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPriceGroupRelModel;
}
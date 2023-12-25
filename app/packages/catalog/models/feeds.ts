import ExtendedModel from '../../../modules/db/model';
import {IFeeds} from '../../../@types/catalog';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Feeds extends ExtendedModel {
	}

	Feeds.init({
		feed_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		title: {
			type: DataTypes.STRING(255),
		},
		type: {
			type: DataTypes.ENUM('google-shopping', 'facebook'),
		},
		conditions: {
			type: DataTypes.JSON
		},
		data: {
			type: DataTypes.JSON
		},
		is_protected: {
			type: DataTypes.JSON,
			allowNull: true
		},
		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'feeds',
		deletedAt: 'deleted_at',
		modelName: 'feeds',
		sequelize
	});
}

export interface IFeedsModel extends ExtendedModel, IFeeds {
}

export type IFeedsModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IFeedsModel;
}
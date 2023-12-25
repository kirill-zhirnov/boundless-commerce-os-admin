import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {ITrackNumber} from '../../../@types/orders';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class TrackNumber extends ExtendedModel {
	}

	TrackNumber.init({
		track_number_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		order_id: {
			type: DataTypes.INTEGER
		},

		track_number: {
			type: DataTypes.TEXT
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'track_number',
		modelName: 'trackNumber',
		sequelize
	});

	return TrackNumber;
}

export interface ITrackNumberModel extends ExtendedModel, ITrackNumber {
}

export type ITrackNumberModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ITrackNumberModel;
}
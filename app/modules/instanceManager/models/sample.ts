import ExtendedModel from '../../db/model';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Sample extends ExtendedModel {
	}

	Sample.init({
		sample_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.STRING(255)
		},

		status: {
			type: DataTypes.STRING(255)
		},

		from_instance_id: {
			type: DataTypes.INTEGER
		}
	}, {
		tableName: 'sample',
		modelName: 'sample',
		sequelize
	});

	return Sample;
}

export interface ISampleModel extends ExtendedModel {
	alias: string;
}

export type ISampleModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ISampleModel;
}
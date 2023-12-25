import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class Stream extends ExtendedModel {
	}

	Stream.init({
		stream_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		}
	}, {
		tableName: 'stream',
		modelName: 'stream',
		sequelize
	});

	return Stream;
}
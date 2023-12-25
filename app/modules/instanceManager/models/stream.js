import ExtendedModel from '../../db/model';

export default function (sequelize, DataTypes) {
	class Stream extends ExtendedModel {
	}

	Stream.init({
		stream_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'stream',
		modelName: 'stream',
		sequelize
	});

	return Stream;
}
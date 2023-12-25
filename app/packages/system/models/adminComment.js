import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class AdminComment extends ExtendedModel {
	}

	AdminComment.init({
		comment_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		essence_id: {
			type: DataTypes.INTEGER
		},

		person_id: {
			type: DataTypes.INTEGER
		},

		comment: {
			type: DataTypes.TEXT
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'admin_comment',
		modelName: 'adminComment',
		sequelize
	});

	return AdminComment;
}
import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class PersonVisitor extends ExtendedModel {
	}

	PersonVisitor.init({
		person_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		user_agent: {
			type: DataTypes.TEXT,
			allowNull: true
		}
	}, {
		tableName: 'person_visitor',
		modelName: 'personVisitor',
		sequelize
	});

	return PersonVisitor;
}
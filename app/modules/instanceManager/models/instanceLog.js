import ExtendedModel from '../../db/model';

export default function(sequelize, DataTypes) {
	class InstanceLog extends ExtendedModel {
	}

	InstanceLog.init({
		log_id : {
			type : DataTypes.INTEGER,
			primaryKey : true,
			autoIncrement : true
		},

		instance_id : {
			type : DataTypes.INTEGER
		},

		action : {
			type : DataTypes.STRING(30)
		},

		status : {
			type : DataTypes.STRING(30),
			allowNull : true
		},

		transaction_type : {
			type : DataTypes.STRING(30),
			allowNull : true
		},

		amount : {
			type: DataTypes.DECIMAL(20,2),
			allowNull : true
		},

		tariff_id : {
			type : DataTypes.INTEGER,
			allowNull : true
		},

		data : {
			type : DataTypes.JSONB,
			allowNull : true
		},

		ts : {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'instance_log',
		modelName: 'instanceLog',
		sequelize
	});
}


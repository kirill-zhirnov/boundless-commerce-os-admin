import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class TransferItem extends ExtendedModel {
	}

	TransferItem.init({
		transfer_item_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		transfer_id: {
			type: DataTypes.INTEGER
		},

		item_id: {
			type: DataTypes.INTEGER
		},

		qty: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'transfer_item',
		modelName: 'transferItem',
		sequelize
	});

	return TransferItem;
}
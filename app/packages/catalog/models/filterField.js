import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class FilterField extends ExtendedModel {
		static async updateSort(filterId, sort) {
			for (let i = 0; i < sort.length; i++) {
				const id = sort[i];
				await this.sequelize.sql(`
					update
						filter_field
					set
						sort = :sort
					where
						field_id = :id
						and filter_id = :filterId
				`, {
					id,
					filterId,
					sort: i * 10
				});
			}
		}
	}

	FilterField.init({
		field_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		filter_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.ENUM('brand', 'price', 'availability', 'characteristic') // 'category'
		},

		characteristic_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'filter_field',
		modelName: 'filterField',
		sequelize
	});

	return FilterField;
}
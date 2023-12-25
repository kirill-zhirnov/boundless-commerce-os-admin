/**
		Таблица нужна для установки связей между товарами и характеристиками, которые
		используются в вариантах (rel_type=variant). Иначе характеристики, которые
		имеют отношение только к товару (а не к тов. группе) будет не найти (тк другой связи между
		характеристикой и товаром нет).

		Также таблица нужна для сортировки вариантов внутри товара.
*/
import ExtendedModel from '../../../modules/db/model';

export default function (sequelize, DataTypes) {
	class ProductVariantCharacteristic extends ExtendedModel {
	}

	ProductVariantCharacteristic.init({
		rel_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		product_id: {
			type: DataTypes.INTEGER
		},

		characteristic_id: {
			type: DataTypes.INTEGER
		},

		//		type=redefine is not used any more!!!
		rel_type: {
			type: DataTypes.ENUM('variant', 'redefine')
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		}
	}, {
		tableName: 'product_variant_characteristic',
		modelName: 'productVariantCharacteristic',
		sequelize
	});

	return ProductVariantCharacteristic;
}
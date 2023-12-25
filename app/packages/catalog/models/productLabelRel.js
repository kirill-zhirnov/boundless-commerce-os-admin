import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class ProductLabelRel extends ExtendedModel {
		static setRel(productId, labels) {
			if (labels == null) {labels = [];}
			let sql = '\
delete from product_label_rel \
where \
product_id = :productId\
';

			if (labels.length !== 0) {
				sql += ' and label_id not in (:labels)';
			}

			return this.sequelize.sql(sql, {productId, labels})
				.then(() => {
					sql = '\
insert into product_label_rel \
(label_id, product_id) \
values \
(:labelId, :productId) \
on conflict (product_id, label_id) \
do nothing\
';

					let f = Q();
					for (let labelId of Array.from(labels)) {
						(labelId => {
							return f = f.then(() => {
								return this.sequelize.sql(sql, {productId, labelId});
							});
						})(labelId);
					}

					return f;
				}).then(() => {
				});
		}

		static rmFromProducts(labelId) {
			const sql = '\
delete from product_label_rel \
where label_id = :labelId\
';

			return this.sequelize.sql(sql, {labelId})
				.then(() => {
				});
		}
	}

	ProductLabelRel.init({
		label_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		product_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'product_label_rel',
		modelName: 'productLabelRel',
		sequelize
	});

	return ProductLabelRel;
}
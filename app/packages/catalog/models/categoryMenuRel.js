import ExtendedModel from '../../../modules/db/model';
import Q from 'q';
// import _ from 'underscore';

export default function (sequelize, DataTypes) {
	class CategoryMenuRel extends ExtendedModel {
		static showInCategoryMenu(pk, siteId) {
			const deferred = Q.defer();

			Q(this.sequelize.model('menuBlock').findOrCreate({
				where: {
					site_id: siteId,
					key: 'category'
				}
			}))
				.spread((block) => {
					return this.sequelize.sql('\
insert into category_menu_rel \
(category_id, block_id) \
select \
category_id, \
:block \
from \
category \
where \
category.category_id in (:pk) \
on conflict \
do nothing\
', {
						pk,
						block: block.block_id,
						site: siteId
					});
				})
				.then(() => {
					return deferred.resolve();
				}).done();

			return deferred.promise;
		}

		static hideFromCategoryMenu(pk, siteId) {
			const deferred = Q.defer();

			this.sequelize.sql('\
delete from category_menu_rel \
using menu_block \
where \
category_menu_rel.block_id = menu_block.block_id \
and menu_block.key = \'category\' \
and category_menu_rel.category_id in (:pk) \
and menu_block.site_id = :site\
', {
				pk,
				site: siteId
			})
				.then(() => {
					return deferred.resolve();
				});

			return deferred.promise;
		}
	}

	CategoryMenuRel.init({
		category_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		},

		block_id: {
			type: DataTypes.INTEGER,
			primaryKey: true
		}
	}, {
		tableName: 'category_menu_rel',
		modelName: 'categoryMenuRel',
		sequelize
	});

	return CategoryMenuRel;
}
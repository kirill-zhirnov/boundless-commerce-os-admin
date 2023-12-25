import ExtendedModel from '../../../modules/db/model';
import Q from 'q';

export default function (sequelize, DataTypes) {
	class Typearea extends ExtendedModel {
		setText(text) {
			const deferred = Q.defer();

			this.sequelize.sql('\
update \
typearea_block \
set \
deleted_at = now() \
where \
typearea_id = :typeareId \
and type = \'text\'\
', {
				//@ts-ignore
				typeareId: this.typearea_id
			})
				.then(() => {
					return this.sequelize.sql('\
insert into typearea_block \
(typearea_id, type) \
values \
(:typeareId, \'text\') \
returning *\
', {
						//@ts-ignore
						typeareId: this.typearea_id
					});
				})
				.then(row => {
					return this.sequelize.sql('\
update \
typearea_block_text \
set \
value = :value \
where \
block_id = :blockId\
', {
						//@ts-ignore
						blockId: row.block_id,
						value: text
					});
				})
				.then(() => {
					return deferred.resolve();
				}).catch(e => {
					return deferred.reject(e);
				});

			return deferred.promise;
		}
	}

	Typearea.init({
		typearea_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'typearea',
		modelName: 'typearea',
		sequelize
	});

	return Typearea;
}
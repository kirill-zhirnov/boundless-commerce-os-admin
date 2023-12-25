import ExtendedModel from '../../../modules/db/model';
import moment from 'moment';

export default function (sequelize, DataTypes) {
	class ProductImportLog extends ExtendedModel {
		static async findOptions(siteId, lang) {
			const rows = await this.sequelize.sql('\
select \
product_import_log.import_id, \
product_import_log.log_id, \
product_import_log.file_name, \
product_import_log.completed_at \
from \
product_import \
inner join product_import_log using (import_id) \
where \
site_id = :site \
and lang_id = :lang \
and status in (\'success\', \'error\') \
and product_import_log.file_name is not null \
order by product_import_log.completed_at desc\
', {
				site: siteId,
				lang: lang.lang_id
			});

			const out = [];
			moment.locale(lang.code);

			for (const row of rows) {
				//@ts-ignore
				const {file_name, completed_at, log_id} = row;
				const title = file_name.length > 10 ? `${file_name.slice(0, 10)}...` : file_name;
				out.push([log_id, `${moment(completed_at).format('ddd D MMM, H:mm')}, ${title}`]);
			}

			return out;
		}
	}

	ProductImportLog.init({
		log_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		import_id: {
			type: DataTypes.INTEGER
		},

		file_name: {
			type: DataTypes.TEXT
		},

		file_path: {
			type: DataTypes.STRING(255)
		},

		status: {
			type: DataTypes.ENUM('avaiting_download', 'downloading', 'awaiting_setup', 'ready_for_import', 'in_progress', 'success', 'error')
		},

		started_at: {
			type: DataTypes.DATE
		},

		completed_at: {
			type: DataTypes.DATE
		},

		result: {
			type: DataTypes.JSON
		}
	}, {
		tableName: 'product_import_log',
		modelName: 'productImportLog',
		sequelize
	});

	return ProductImportLog;
}
import ExtendedModel from '../../db/model';
import {BuildOptions} from 'sequelize';

export default function (sequelize, DataTypes) {
	class Host extends ExtendedModel {
		static async clearPrimaryByInstance(instanceId: number) {
			await this.destroy({
				where: {
					instance_id: instanceId,
					type: 'primary'
				}
			});
		}
	}

	Host.init({
		host_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		instance_id: {
			type: DataTypes.INTEGER
		},

		host: {
			type: DataTypes.TEXT
		},

		our_dns_records: {
			type: DataTypes.BOOLEAN
		},

		type: {
			type: DataTypes.STRING(255)
		},

		site_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		}

	}, {
		tableName: 'host',
		modelName: 'host',
		sequelize
	});
}

export interface IHostModel extends ExtendedModel {
	host_id: number;
	host: string;
}

export type IHostModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IHostModel;

	clearPrimaryByInstance(instanceId: number): Promise<void>
}
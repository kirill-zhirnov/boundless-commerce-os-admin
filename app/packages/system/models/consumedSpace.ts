import ExtendedSequelize from '../../../modules/db/sequelize';
import ExtendedModel from '../../../modules/db/model';
import {ITaxClass} from '../../../@types/system';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class ConsumedSpace extends ExtendedModel {
		static async calcSpaceByType(): Promise<{s3: number, db: number}> {
			const rows = await this.sequelize.sql<{type: string, volume: string}>(`
				select
					type, sum(volume) as volume
				from
					consumed_space
				group by type
			`);

			const values = {s3: 0, db: 0};
			rows.forEach(({type, volume}) => values[type] = parseInt(volume));

			return values;
		}

		static async calcSpaceByTypeFormatted(): Promise<{s3: string, db: string}> {
			const rows = await this.sequelize.sql<{type: string, volume: string}>(`
				select
					type, pg_size_pretty(sum(volume)) as volume
				from
					consumed_space
				group by type
			`);

			const values = {s3: '0 MB', db: '0 MB'};
			rows.forEach(({type, volume}) => values[type] = volume);

			return values;
		}

		static async increaseConsumedOnS3(size: number) {
			await this.sequelize.sql(`
				update consumed_space
				set
					volume = volume + :size
				where
					type = :s3
					and bucket = :bucket
			`, {
				s3: 's3',
				bucket: '__system',
				size
			});
		}
	}

	ConsumedSpace.init({
		space_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},
		type: {
			type: DataTypes.ENUM('s3', 'db')
		},
		volume: {
			type: DataTypes.INTEGER
		},
		bucket: {
			type: DataTypes.STRING(100)
		},
		updated_at: {
			type: DataTypes.DATE
		},
	}, {
		tableName: 'consumed_space',
		modelName: 'consumedSpace',
		sequelize
	});

	return ConsumedSpace;
}

export interface IConsumedSpaceModel extends ExtendedModel, ITaxClass {
}

export type IConsumedSpaceModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): IConsumedSpaceModel;

	calcSpaceByType: () => Promise<{s3: number, db: number}>;
	calcSpaceByTypeFormatted: () => Promise<{s3: string, db: string}>;
	increaseConsumedOnS3: (size: number) => Promise<void>;
}
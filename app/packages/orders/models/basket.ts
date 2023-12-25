import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class Basket extends ExtendedModel {
		static async getBasketByPerson(personId: number): Promise<IBasketRow> {
			const [row] = await this.sequelize.sql<IBasketRow>('select * from basket_get(:personId)', {
				personId
			});

			return row;
		}
	}

	Basket.init({
		basket_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		person_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		is_active: {
			type: DataTypes.BOOLEAN
		}
	}, {
		tableName: 'basket',
		modelName: 'basket',
		sequelize
	});

	return Basket;
}

export interface IBasketModel extends ExtendedModel {
	basket_id: number;
	person_id: number|null;
	is_active: boolean;

	getBasketByPerson: (personId: number) => Promise<IBasketRow>;
}

export type IBasketModelStatic = typeof ExtendedModel & {
	new (values?: object, options?: BuildOptions): IBasketModel;
}

export type IBasketRow = Pick<IBasketModel, 'basket_id' | 'person_id' | 'is_active'>;
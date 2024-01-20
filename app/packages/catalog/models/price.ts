import ExtendedModel from '../../../modules/db/model';
import {IPrice} from '../../../@types/catalog';
import {BuildOptions} from 'sequelize';
import {IPriceTextModel} from './priceText';
import {TOptionItem} from '../../../@types/utils';
import JedExtended from '../../../modules/i18n/jed.client';
import {IPriceGroupRelModel} from './priceGroupRel';

export default function (sequelize, DataTypes) {
	class Price extends ExtendedModel {
		static async findPricesOptions(langId: number, out: TOptionItem[] = []) {
			const rows = (await this.findAll({
				include: [{
					model: sequelize.model('priceText'),
					where: {
						lang_id: langId
					}
				}],
				where: {
					deleted_at: null
				},
				order: [
					['sort', 'ASC']
				]
			})) as unknown as IPriceModel[];

			for (const row of rows) {
				out.push([row.price_id, row.priceTexts[0].title]);
			}

			return out;
		}

		static async findAllOptions(langId: number, i18n: JedExtended, out: TOptionItem[] = []) {
			const rows = await this.sequelize.sql<{price_id: number, title: string, has_old_price: boolean}>(`
				select
					price_id, title, has_old_price
				from
					price
					inner join price_text using(price_id)
				where
					deleted_at is null
				order by sort asc
			`);

			for (const {price_id, title, has_old_price} of rows) {
				out.push([price_id, title]);

				if (has_old_price) {
					out.push([`${price_id}_old`, `${i18n.__('Compare-at price')} (${title})`]);
				}
			}

			return out;
		}

		static async loadAllPrices(langId: number) {
			const rows = await this.sequelize.sql<IAllPriceRow>(`
				select
					p.price_id,
					p.alias,
					p.has_old_price,
					pt.title
				from
					price p
					inner join price_text pt on p.price_id = pt.price_id and pt.lang_id = :lang
				where
					p.deleted_at is null
				order by p.sort asc
				`, {
				lang: langId
			});

			return rows;
		}

		static getSystemAliases() {
			return ['selling_price', 'purchase_price'];
		}

		isSystemPrice() {
			//@ts-ignore
			return ['selling_price', 'purchase_price'].includes(this.alias);
		}
	}

	Price.init({
		price_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		alias: {
			type: DataTypes.TEXT
		},

		is_public: {
			type: DataTypes.BOOLEAN
		},

		has_old_price: {
			type: DataTypes.BOOLEAN
		},

		sort: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'price',
		deletedAt: 'deleted_at',
		modelName: 'price',
		sequelize
	});

	return Price;
}

export interface IPriceModel extends ExtendedModel, IPrice {
	readonly priceTexts?: IPriceTextModel[];
	readonly priceGroupRels?: IPriceGroupRelModel[];

	isSystemPrice: () => boolean;
}

export type IPriceModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPriceModel;

	findPricesOptions: (langId: number, out?: TOptionItem[]) => Promise<TOptionItem[]>;
	findAllOptions: (langId: number, i18n: JedExtended, out?: TOptionItem[]) => Promise<TOptionItem[]>;
	loadAllPrices: (langId: number) => Promise<IAllPriceRow>;
	getSystemAliases: () => string[];
}

interface IAllPriceRow {
	price_id: number,
	alias: string,
	has_old_price: boolean,
	title: string,
}
import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {IPaymentMethod} from '../../../@types/payment';
import {BuildOptions} from 'sequelize';
import {IPaymentMethodTextModel} from './paymentMethodText';
import {IPaymentGatewayModel} from './paymentGateway';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class PaymentMethod extends ExtendedModel {
		//			Find all options (theresult is not filtered by site_id)
		static async findAllOptions(langId: number, out: any[] = [], addMarkupToTitle = false) {
			const rows = await this.sequelize.sql<{payment_method_id: number, title: string, mark_up: string}>(`
				select
					distinct
					payment_method_id,
					title,
					mark_up,
					sort
				from
					payment_method
					inner join payment_method_text using(payment_method_id)
				where
					deleted_at is null
					and lang_id = :lang
				order by
					sort asc
						`, {
				lang: langId
			});

			for (const row of rows) {
				let title = row.title;
				if (addMarkupToTitle && Number(row.mark_up) !== 0) {
					title += ` (markup: ${row.mark_up}%)`;
				}

				out.push([row.payment_method_id, title, {mark_up: row.mark_up}]);
			}

			return out;
		}

		static async findOptionsBySite(langId: number, siteId: number, out = []) {
			const rows = await this.findBySite(langId, siteId);
			for (const row of rows) {
				out.push([row.payment_method_id, row.title, row.mark_up]);
			}

			return out;
		}

		static async findBySite(langId: number, siteId: number) {
			return this.sequelize.sql<IPaymentMethod & {
				title: string
			}>(`
				select
					*
				from
					payment_method
					inner join payment_method_text using(payment_method_id)
				where
					deleted_at is null
					and lang_id = :lang
					and site_id = :site
				order by
					sort asc
		`, {
				lang: langId,
				site: siteId
			});
		}

		static findByDelivery(deliveryId, langId, siteId) {
			return this.sequelize.sql('\
		SELECT \
		DISTINCT \
		payment_method.*, \
		payment_method_text.title, \
		payment_gateway.alias as gateway_alias \
		FROM \
		payment_method \
		inner join payment_method_text using(payment_method_id) \
		left join payment_method_delivery using(payment_method_id) \
		left join delivery_site using(delivery_site_id) \
		left join payment_gateway using(payment_gateway_id) \
		WHERE \
		payment_method.site_id = :site \
		AND payment_method.deleted_at is null \
		AND payment_method_text.lang_id = :lang \
		AND ( \
		payment_method.for_all_delivery is TRUE \
		OR ( \
		delivery_site.site_id = :site \
		and delivery_site.delivery_id = :delivery \
		) \
		) \
		ORDER BY \
		payment_method.sort ASC\
		', {
				delivery: deliveryId,
				lang: langId,
				site: siteId
			})
				.then(rows => rows);
		}

		static findByAlias(alias, siteId) {
			return this.sequelize.sql('\
		SELECT \
		payment_method.*, \
		payment_gateway.settings \
		FROM \
		payment_method \
		INNER JOIN payment_gateway USING(payment_gateway_id) \
		WHERE \
		payment_method.site_id = :site \
		AND payment_gateway.alias = :alias \
		AND payment_method.deleted_at is null\
		', {
				site: siteId,
				alias
			})
				.then(rows => {
					return rows[0];
				});
		}
	}

	PaymentMethod.init({
		payment_method_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		site_id: {
			type: DataTypes.INTEGER
		},

		payment_gateway_id: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		for_all_delivery: {
			type: DataTypes.BOOLEAN
		},

		config: {
			type: DataTypes.JSONB,
			allowNull: true
		},

		mark_up: {
			type: DataTypes.DECIMAL(5, 3),
			allowNull: true
		},

		sort: {
			type: DataTypes.INTEGER
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'payment_method',
		deletedAt: 'deleted_at',
		modelName: 'paymentMethod',
		sequelize
	});

	return PaymentMethod;
}

export interface IPaymentMethodModel extends ExtendedModel, IPaymentMethod {
	readonly paymentGateway?: IPaymentGatewayModel;
	readonly paymentMethodTexts?: IPaymentMethodTextModel[];
}

export type IPaymentMethodModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): IPaymentMethodModel;

	findAllOptions: (langId: number, out?: any[], addMarkupToTitle?: boolean) => Promise<any[][]>;
}
import ExtendedModel from '../../../modules/db/model';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';
import {ICouponCampaign} from '../../../@types/orders';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class CouponCampaign extends ExtendedModel {
		static getDiscountTypeOptions(i18n, out = []) {
			return out.concat([
				['percent', i18n.__('Percent')],
				['fixed', i18n.p__('discount', 'Fixed')],
			]);
		}

		static getLimitTypeOptions(i18n, out = []) {
			return out.concat([
				['reusable', i18n.__('Coupon code can be used multiple times')],
				['single', i18n.__('Coupon code can be used only single time')],
			]);
		}

		static async findOptions(out = []) {
			const rows = await this.sequelize.sql<Pick<ICouponCampaign, 'campaign_id' | 'title'>>(`
				select
					campaign_id,
					title
				from
					coupon_campaign
				where
					deleted_at is null
				order by title asc
			`);

			for (const row of rows) {
				out.push([row.campaign_id, row.title]);
			}

			return out;
		}
	}

	CouponCampaign.init({
		campaign_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		title: {
			type: DataTypes.STRING(255)
		},

		discount_type: {
			type: DataTypes.STRING(10),
			allowNull: true
		},

		discount_value: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		limit_usage_per_code: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		limit_usage_per_customer: {
			type: DataTypes.INTEGER,
			allowNull: true
		},

		min_order_amount: {
			type: DataTypes.DECIMAL(20, 2),
			allowNull: true
		},

		created_at: {
			type: DataTypes.DATE
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'coupon_campaign',
		deletedAt: 'deleted_at',
		modelName: 'couponCampaign',
		sequelize
	});

	return CouponCampaign;
}

export interface ICouponCampaignModel extends ExtendedModel, ICouponCampaign {
}

export type ICouponCampaignModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICouponCampaignModel;
}
import ExtendedModel from '../../../modules/db/model';
import randomString from 'random-string';
import ExtendedSequelize from '../../../modules/db/sequelize';
import {BuildOptions} from 'sequelize';
import {ICouponCode} from '../../../@types/orders';

export default function (sequelize: ExtendedSequelize, DataTypes) {
	class CouponCode extends ExtendedModel {
		static async makeUniqueCodes(amount, out = []) {
			const code = String(randomString({length: 8})).toUpperCase();

			const row = await this.findOne({
				where: {
					code
				}
			});

			if (row) {
				return this.makeUniqueCodes(amount, out);
			} else {
				out.push(code);

				if (out.length < amount) {
					return this.makeUniqueCodes(amount, out);
				} else {
					return out;
				}
			}
		}
	}

	CouponCode.init({
		code_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		campaign_id: {
			type: DataTypes.INTEGER
		},

		code: {
			type: DataTypes.TEXT
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'coupon_code',
		modelName: 'couponCode',
		sequelize
	});

	return CouponCode;
}

export interface ICouponCodeModel extends ExtendedModel, ICouponCode {
}

export type ICouponCodeModelStatic = typeof ExtendedModel & {
	new(values?: object, options?: BuildOptions): ICouponCodeModel;
}

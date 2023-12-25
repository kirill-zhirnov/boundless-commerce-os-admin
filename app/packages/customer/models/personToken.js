import ExtendedModel from '../../../modules/db/model';
import randomString from 'random-string';

export default function (sequelize, DataTypes) {
	class PersonToken extends ExtendedModel {
		static async findToken(type, tokenId, token1, token2, ip = null) {
			const whereAttrs = {
				token_id: tokenId,
				type,
				token_1: token1,
				token_2: token2
			};

			if (ip != null) {
				whereAttrs.ip = ip;
			}

			const criteria = {
				where: sequelize.and(whereAttrs, sequelize.literal('(valid_till >= now() or valid_till is null)'))
			};

			return this.findOne(criteria);
		}

		static createToken(type, personId, ip = null, validTill = null) {
			return this.create({
				person_id: personId,
				type,
				token_1: randomString({length: 30}),
				token_2: randomString({
					length: 10,
					letters: false,
					numeric: true,
					special: false
				}),
				ip,
				valid_till: validTill
			});
		}
	}

	PersonToken.init({
		token_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		person_id: {
			type: DataTypes.INTEGER
		},

		type: {
			type: DataTypes.STRING
		},

		token_1: {
			type: DataTypes.STRING
		},

		token_2: {
			type: DataTypes.STRING
		},

		ip: {
			type: DataTypes.STRING
		},

		valid_till: {
			type: DataTypes.DATE
		},

		created_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'person_token',
		modelName: 'personToken',
		sequelize
	});

	return PersonToken;
}
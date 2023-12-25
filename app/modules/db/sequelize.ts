import {Sequelize} from 'sequelize';
import _ from 'underscore';
import squel from './squel';

export default class ExtendedSequelize extends Sequelize {
	async sql<T = {[k:string]: any}>(sql, replacements = {}, options = {}): Promise<T[]> {
		_.defaults(options, {
			replacements
		});

		const [rows] = await this.query(sql, options);

		return rows as unknown as T[];
	}

	escapeSphinxParam(val) {
		// eslint-disable-next-line
		const regExp = /([=\(\)|\-!@~\"&/\\\^\$\=])/g;

		// eslint-disable-next-line
		return val.replace(regExp, '\\\$1');
	}

	async sqlOne(...args) {
		//@ts-ignore
		const [row] = await this.sql(...args);
		return row;
	}

	escapeIn(value) {
		if (!Array.isArray(value)) {
			throw new Error('Value must be an array!');
		}

		const escaped = [];
		value.forEach(val => escaped.push(this.escape(val)));

		return escaped.join(',');
	}

	generateJoinValues(idList) {
		const out = [];
		for (let pos = 0; pos < idList.length; pos++) {
			const id = idList[pos];
			out.push(`(${id}, ${pos})`);
		}

		if (out.length === 0) {
			out.push('(-1, 0)');
		}

		return `values ${out.join(',')}`;
	}

	squel() {
		return squel;
	}

	fn(...args) {
		//@ts-ignore
		return Sequelize.fn(...args);
	}

	// findOne(...params) {
	// 	return this.findOne(...params);
	// }

	execSquel<T>(query, execOptions = {}) {
		const params = query.toParam();

		return this.sql<T>(params.text, params.values, execOptions);
	}

	static getConstructOptions(options = {}) {
		return Object.assign({
			// operatorsAliases: false,
			define: {
				underscored: true,
				timestamps: false,
				hooks: {
					beforeBulkUpdate(options) {
						options.attributes = this.checkNullFields(options.attributes);
					},

					beforeUpdate(instance) {
						instance.checkNullFields();
					},

					beforeCreate(instance) {
						instance.checkNullFields();
					}
				}
			}
		}, options);
	}
}

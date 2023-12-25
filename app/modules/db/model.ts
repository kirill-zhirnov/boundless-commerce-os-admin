import {Sequelize, Model} from 'sequelize';
import ExtendedSequelize from './sequelize';
import {FindOptions, ModelType} from 'sequelize/types/lib/model';

const errors = require('../errors/errors');

export default class ExtendedModel extends Model {
	public sequelize: ExtendedSequelize;
	public static sequelize: ExtendedSequelize;

	checkNullFields() {
		//@ts-ignore
		for (const [attr, prop] of Object.entries(this.constructor.rawAttributes)) {
			//@ts-ignore
			if ((prop.allowNull === true) && (this[attr] === '')) {
				this[attr] = null;
			}
		}
	}

	static async safeDelete(options = {where: {}}) {
		if (this.options.deletedAt) {
			await this.update({
				//@ts-ignore
				[this.options.deletedAt]: Sequelize.fn('NOW')
			}, options);
		} else {
			await this.destroy(options);
		}
	}

	static async recover(options = {where: {}}) {
		if (this.options.deletedAt) {
			await this.update({
				//@ts-ignore
				[this.options.deletedAt]: null
			}, options);
		} else {
			throw new Error('Model does not have deletedAt attribute!');
		}
	}

	static async findOptions() {
		//@ts-ignore
		if (!this.options.optionsSettings?.key || !this.options.optionsSettings?.title)
			throw new Error('You must define optionsSettings.key && optionsSettings.title!');

		//@ts-ignore
		const obj = (!this.scoped && Array.isArray(this.options.optionsSettings.scopes) && this.options.optionsSettings.scopes.length > 0)
			//@ts-ignore
			? this.scope(this.options.optionsSettings.scopes)
			: this
		;

		const rows = await obj.findAll();
		const out = [];
		for (const row of rows) {
			//@ts-ignore
			out.push([row[this.options.optionsSettings.key], row[this.options.optionsSettings.title]]);
		}

		return out;
	}

	static async findException(options: FindOptions) {
		const row = await this.findOne(options);

		if (row)
			return row;

		throw new errors.HttpError(404, `Cannot find model '${this.name}'.`);
	}

	static checkNullFields(attrs) {
		for (const [attr, prop] of Object.entries(this.rawAttributes)) {
			if (prop.allowNull === true && attrs[attr] === '') {
				attrs[attr] = null;
			}
		}

		return attrs;
	}
}

export type ExtendedModelCtor<M extends ExtendedModel> = { new (): M } & ModelType & typeof ExtendedModel;


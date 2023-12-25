import BasicController from '../controller/basic';
import ExtendedSequelize from '../db/sequelize';
import ExtendedModel from '../db/model';
import {IServerClientRegistry} from '../../@types/registry/serverClientRegistry';
import JedExtended from '../i18n/jed.client';
import _ from 'underscore';
import validator from '../validator/validator';
import validators from './validators';
import customValidators from './validators/index';
import sanitizers from './sanitizers';
import customSanitizers from './sanitizers/index';
import {ISite} from '../../@types/site';
import {ILang} from '../../@types/countryLang';
import utils from '../utils/common.client';
import {types} from 'util';
import BasicDataProvider from '../dataProvider';
import FormKit from '../controller/helpers/formKit';
import {IInstanceRegistry} from '../../@types/registry/instanceRegistry';

export default abstract class BasicForm <Attributes = {}, Record =  ExtendedModel | {[key: string]: any}> {
	protected controller: BasicController;
	protected db: ExtendedSequelize;
	protected scenario: string | null;
	protected pk: string | number;
	protected record: Record | null;
	protected attributes: Attributes;
	protected safeAttrs: Partial<Attributes>;
	protected errors: IErrors;
	protected validators: IValidators;
	protected sanitizers: ISanitizers;
	protected i18n: JedExtended;
	protected options: IOptionsList;

	constructor(options: IFormOptions<Record>) {
		this.controller = options.controller;

		if (options.pk) this.pk = options.pk;
		if (options.record) this.record = options.record;
		this.db = this.controller.getInstanceRegistry().getDb();
		this.i18n = this.controller.getClientRegistry().getI18n();

		this.setupValidators();
		this.setupSanitizers();

		this.initialize(options);
	}

	// eslint-disable-next-line
	initialize(options: IFormOptions<Record>) {
	}

	getRules(): TFormRules {
		return [];
	}

	save() { }

	async setup() {
		this.setupScenario();
		await this.setupAttrs();
	}

	async setupAttrs() {
		await this.getRecord();

		if (this.record) {
			await this.setupAttrsByRecord();
		} else {
			this.setAttributes(this.getDefaultAttrs());
		}
	}

	async getRecord(): Promise<null | ExtendedModel | {}> {
		if (this.record || !this.pk)
			return this.record;

		this.record = await this.loadRecord();

		return this.record;
	}

	/**
	 * Abstract method which might be redefined
	 */
	async loadRecord(): Promise<null | Record> {
		return null;
	}

	async validate() {
		this.resetErrors();

		this.safeAttrs = {};
		let safeAttrsKeys = [];

		const parsedRules = this.parseRules();
		for (const [field, rules] of Object.entries(parsedRules)) {
			let attrAddedToSafe = false;

			for (const [rule, options] of Object.entries(rules)) {
				if (!attrAddedToSafe) {
					attrAddedToSafe = true;
					safeAttrsKeys.push(field);
				}

				if (this.isSanitizer(rule)) {
					this.attributes[field] = await this.executeSanitizer(rule, this.attributes[field], options, field);
				} else {
					//					do not execute validators if field has already had errors.
					if (this.hasErrors(field))
						continue;

					await this.executeValidator(field, rule, options);
				}
			}
		}

		const hasErrors = this.hasErrors();
		if (hasErrors) {
			safeAttrsKeys = this.excludeErrorsFromSafeAttrs(safeAttrsKeys);
		}

		this.safeAttrs = _.pick(this.attributes, safeAttrsKeys);

		if (hasErrors) {
			return Promise.reject(this.getErrors());
		} else {
			return this.safeAttrs;
		}
	}

	setSafeAttr(attr: string, val: any) {
		this.safeAttrs[attr] = val;

		return this;
	}

	excludeErrorsFromSafeAttrs(safeAttrsKeys) {
		const out = [];
		for (const attr of safeAttrsKeys) {
			if (!this.hasErrors(attr)) {
				out.push(attr);
			}
		}

		return out;
	}

	async executeValidator(field: string, rule: string, options: {[key: string]: any} = {}) {
		const args = [this.attributes[field], options, field, this.attributes, this];

		try {
			let result;
			if (_.isFunction(this[rule])) {
				result = await this[rule](...args);
			} else if (rule in this.validators) {
				result = await this.validators[rule](...args);
			} else {
				throw new Error(`Rule '${rule}' does not exist.`);
			}

			if (_.isObject(result) && result.code && result.message) {
				this.processValidatorError(field, result as unknown as {code: string, message: string});
			}

		} catch (e) {
			if (e instanceof Error)
				throw e;

			this.processValidatorError(field, e);
		}
	}

	processValidatorError(field: string, result: {code: string, message: string}) {
		this.addError(field, result.code, result.message);
	}


	async executeSanitizer(rule, value, options = {}, field = null) {
		const args = [value, options, field, this.attributes, this];

		return this.sanitizers[rule].apply(this, args);
	}

	setupScenario() {
		if (this.scenario)
			return;

		if (this.pk) {
			this.scenario = 'update';
		} else {
			this.scenario = 'insert';
		}
	}

	setupValidators() {
		this.validators = validators(this.getI18n());

		const i18n = this.getI18n();
		for (const key of Object.keys(customValidators)) {
			this.validators[key] = customValidators[key](i18n);
		}
	}

	setupSanitizers() {
		this.sanitizers = sanitizers;

		const i18n = this.getI18n();
		for (const key of Object.keys(customSanitizers)) {
			this.sanitizers[key] = customSanitizers[key](i18n);
		}
	}

	getDb(): ExtendedSequelize {
		return this.db;
	}

	getController(): BasicController {
		return this.controller;
	}

	setAttributes(attributes) {
		this.attributes = attributes;
		return this;
	}

	getAttributes() {
		return this.attributes;
	}

	getSafeAttrs() {
		return this.safeAttrs;
	}

	setSetting(...args) {
		const settings = this.getInstanceRegistry().getSettings();

		return settings.set(...args);
	}

	getSetting(group: string, key: string) {
		return this.getInstanceRegistry().getSettings()
			.get(group, key)
		;
	}

	getSafeAttr(attr: string, defaultVal: any = undefined) {
		if (attr in this.safeAttrs) {
			return this.safeAttrs[attr];
		}

		return defaultVal;
	}

	getClientRegistry(): IServerClientRegistry {
		return this.controller.getClientRegistry();
	}

	getI18n(): JedExtended {
		return this.i18n;
	}

	__(...args): string {
		return this.getI18n().__(...args);
	}

	p__(...args): string {
		return this.getI18n().p__(...args);
	}

	essenceChanged(...args) {
		return this.getController().essenceChanged.apply(this.getController(), [...args]);
	}

	setPk(pk) {
		this.pk = pk;
		return this;
	}

	getPk() {
		return this.pk;
	}

	getView() {
		return this.getController().getView();
	}

	getModel(name) {
		return this.getDb().model(name);
	}

	setRecord(record) {
		this.record = record;
		return this;
	}

	getParam(...args) {
		//@ts-ignore
		return this.controller.getParam(...args);
	}

	setupAttrsByRecord() {
		let row;
		if (this.record instanceof ExtendedModel) {
			row = this.record.toJSON();
		} else {
			row = this.record;
		}

		this.setAttributes(_.pick(row, this.getSafeAttrsKeys()));
	}

	getSafeAttrsKeys() {
		return Object.keys(this.parseRules());
	}

	hasErrors(field: string | null = null): boolean {
		if (field === null) {
			return Object.keys(this.errors).length > 0;
		} else {
			return !!this.errors[field];
		}
	}

	getErrors(field: string | null = null) {
		if (field === null) {
			return this.errors;
		} else {
			return this.errors[field];
		}
	}

	addError(field: string, code: string, message: string) {
		if (!this.errors[field]) {
			this.errors[field] = {};
		}

		this.errors[field][code] = message;

		return this;
	}

	getFormErrors() {
		const out = {};

		const object = this.getErrors();
		for (const field in object) {
			const errors = object[field] as unknown as {};

			for (const key in errors) {
				const error = errors[key];
				out[field] = [error];
				break;
			}
		}

		return out;
	}

	getSingleError(): string {
		const object = this.getFormErrors();
		for (const field in object) {
			const errors = object[field];

			for (const err of errors) {
				return err;
			}
		}
	}

	url(...args) {
		//@ts-ignore
		return this.getController().url(...args);
	}


	/**
	 * //	Rules - should be an array of rules in Yii style, for example:
//	[
//		['field1, field2', 'isInt', {onlyMoreThanZero: true}],
//		['field', 'isString', {someParam: true}, ['scenario']]
//	]
//
//	Each item should be an array, with:
//	- list of fields, separated by comma
//	- validator name
//	- object with validator options (optional)
//	- if you want to specify scenario for rule, add object {on:'scenario'} or {on:['scenario1', 'scenario2']}
//
//	The method will output JSON:
//	{
//		field1 : {
//			isInt : {onlyMoreThanZero: true}
//		},
//		field2 : {
//			isInt : {onlyMoreThanZero: true}
//		}
//	}
//	if scenario is specified - rules will be filtered by the scenario.
	 */
	parseRules(): IParsedRules {
		const out = {};

		const rules = this.getRules();
		for (let key = 0; key < rules.length; key++) {
			const rule: any[] = rules[key];
			if (!Array.isArray(rule))
				throw new Error(`Rule is not an Array! Key: ${key}.`);

			if (!rule[0] || !rule[1])
				throw new Error('Keys 0 and 1 are necessary in rule');

			let options = {};
			let scenarios = [];

			if (rule.length > 2) {
				for (let i = 2; i < rule.length; i++) {
					if (Array.isArray(rule[i])) {
						scenarios = rule[i];
					} else if (_.isObject(rule[i])) {
						options = rule[i];
					} else {
						throw new Error(`Error in rule with line #'${key}': index: #'${i}': Element should be an Array or an Object.`);
					}
				}
			}

			if ((scenarios.length > 0) && (scenarios.indexOf(this.scenario) === -1)) {
				continue;
			}

			const fields = rule[0].split(',');
			for (let field of fields) {
				field = validator.trim(field);

				if (!out[field]) {
					out[field] = {};
				}

				out[field][rule[1]] = options;
			}
		}

		return out;
	}

	getDefaultAttrs() {
		return {};
	}

	booleanToStr(attrs, fields: string[]) {
		for (const field of Array.from(fields)) {
			if (field in attrs) {
				attrs[field] = attrs[field] ? '1' : '0';
			}
		}

		return attrs;
	}

	getBooleanAttrs(booleanKeys: string[]) {
		const attrs = this.getSafeAttrs();
		const out = {};

		for (const field of Array.from(booleanKeys)) {
			out[field] = field in attrs && (attrs[field] === '1') ? true : false;
		}

		return out;
	}

	resetErrors() {
		this.errors = {};
	}

	setScenario(scenario: string) {
		this.scenario = scenario;
		return this;
	}

	setAttributesOnSubmit(attrs) {
		this.setAttributes(attrs);
	}

	isSanitizer(rule: string): boolean {
		return rule in this.sanitizers;
	}

	getLocale() {
		return this.getClientRegistry().getLocale();
	}

	triggerClient(event: string, data: {[key: string]: any} | null = null) {
		this.getController().triggerClient(event, data);
	}

	getUser() {
		return this.getController().getUser();
	}

	getSession() {
		return this.getController().getSession();
	}

	getInstanceRegistry() {
		return this.getController().getInstanceRegistry();
	}

	getRegistry(): IInstanceRegistry {
		console.warn('getRegistry is outdated, use getInstanceRegistry instead');

		return this.getController().getInstanceRegistry();
	}

	getSite(): ISite {
		return this.getClientRegistry().getSite();
	}

	getLang(): ILang {
		return this.getClientRegistry().getLang();
	}

	getEditingSite(): ISite {
		return this.getClientRegistry().getEditingSite();
	}

	getEditingLang(): ILang {
		return this.getClientRegistry().getEditingLang();
	}

	setTsCheckbox(row, field, formValue) {
		if (formValue === '1') {
			if ((row[field] == null)) {
				return row[field] = this.getDb().fn('now');
			}

		} else {
			return row[field] = null;
		}
	}

	getEnv() {
		return this.getController().getEnv();
	}

	getOptionsKeys(options) {
		return utils.getOptionsKeys(options);
	}

	async getOptions(key: string | null = null) {
		if (!this.options) {
			this.options = await this.rawOptions();
		}

		if (key !== null) {
			return this.getOptionsByKey(key);
		} else {
			return this.getOptionsAll();
		}
	}

	async getOptionsByKey(key: string): Promise<string[][]> {
		if (!(key in this.options))
			throw new Error(`Key '${key}' does not exist in @options.`);

		if (types.isPromise(this.options[key])) {
			this.options[key] = await this.options[key];
		}

		return this.options[key];
	}

	async getOptionsAll(): Promise<IOptionsList> {
		for (const [key, val] of Object.entries(this.options)) {
			if (types.isPromise(val)) {
				this.options[key] = await val;
			}
		}

		return this.options;
	}

	async getTplData(): Promise<ITplData<Attributes>> {
		return {
			options: await this.getOptions() as unknown as IOptionsList,
			attrs: this.getAttributes(),
			pk: this.getPk(),
			scenario: this.getScenario()
		};
	}

	rawOptions() {
		return {};
	}

	getScenario(): string | null {
		return this.scenario;
	}

	async createDataProvider(path: string, options: Partial<IFormOptions<Record>> = {}, attributes: {[key: string]: any} = {}): Promise<BasicDataProvider> {
		return this.getController().createDataProvider(path, options, attributes);
	}

	// eslint-disable-next-line
	async prepareChildForm(childForm: BasicForm) { }

	onFormsGroupSaved() { }

	onFormsGroupSaveError() { }

	// eslint-disable-next-line
	setupChildFormKit(childFormKit: FormKit) { }

	async findTextModel(model, attrs) {
		model = _.isString(model) ? this.getModel(model) : model;

		const row = await model.findOne({where: attrs}) || model.build(attrs);

		return row;
	}
}


export interface IFormOptions<Record = ExtendedModel | {[key: string]: any}> {
	controller: BasicController
	pk?: string | number;
	record?: Record;
	[key: string]: any;
}

export interface IParsedRules {
	[field: string]: {
		[ruleName: string]: {}
	}
}

export interface IErrors {
	[field: string]: {
		[code: string]: string
	}
}

export interface IValidators {
	[name: string]: (...args: any) => any
}

export interface ISanitizers {
	[name: string]: () => any
}

export interface IOptionsList {
	[key: string]: string[][]|Promise<string[][]>
}

export interface ITplData<Attributes = {}> {
	options: IOptionsList;
	attrs: Attributes;
	pk: string | number;
	scenario: string | null;
}

export type TFormRules = (string | {[key: string]: any})[][];
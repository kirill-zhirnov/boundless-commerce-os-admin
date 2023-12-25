import BasicController from '../basic';
import FormKit from './formKit';
import extend from 'extend';
import BasicForm, {IFormOptions} from '../../form';
import _ from 'underscore';

export default class FormsGroup {
	protected controller: BasicController;
	protected config: IFormsGroupConfig;
	protected formKits: {[key: string]: FormKit}
	protected formsInited: boolean = false;
	protected formKitsDataInited: boolean = false;
	protected formsWithErrors: string[] = [];
	protected forms: TFormsList;

	constructor(controller: BasicController, forms: TFormsList = {}, config: Partial<IFormsGroupConfig> = {}) {
		this.controller = controller;

		this.config = extend(true, {
			data: null,
			success: this.defaultSuccess,
			successMsg: this.controller.__('Form was successfully saved.'),

			errorAlert: true,
			skipSaveOnEmpty: [],
			skipSetupOnEmpty: [],

			//			callback which will be called before @controller.json() is called.
			beforeJson: null,
			successRedirect: null,
			forceCloseModal: false
		}, config);
		this.forms = forms;
	}

	async process() {
		this.setupFormKitsData();

		try {
			await this.setupForms();
			await this.validate();
			await this.save();
			const forms = await this.getForms();

			if (typeof (this.config.success) === 'function') {
				await this.config.success.call(this, forms);
			} else {
				throw new Error('You must specify success as callback');
			}
		} catch (e) {
			if (e instanceof Error) {
				throw e;
			} else {
				const errors = await this.getFormsErrors();

				if (this.config.errorAlert) {
					this.controller.alertDanger(this.controller.__('Form contains errors!'));
				}

				return this.controller.jsonErrors({forms: errors});
			}
		}
	}

	async validate() {
		const formKits = this.getFormKitsForSave();
		this.formsWithErrors = [];

		const errors = {};
		for (const [formKey, formKit] of Object.entries(formKits)) {
			try {
				await formKit.validate();
			} catch (e) {
				if (e instanceof Error) {
					throw e;
				} else {
					errors[formKey] = e;
					this.formsWithErrors.push(formKey);
				}
			}
		}

		if (Object.keys(errors).length > 0) {
			return Promise.reject(errors);
		}
	}

	async save() {
		try {
			await this.performSave();
			await this.notifyFormsSaveSuccess();
		} catch (e) {
			await this.notifyFormsSaveError();
			return Promise.reject(e);
		}
	}

	async getFormsErrors() {
		const out = {};
		const formKits = this.getFormKits();

		for (const [formName, formKit] of Object.entries(formKits)) {
			const errors = await formKit.getFormErrors();

			if (Object.keys(errors).length) {
				out[formName] = {
					errors
				};
			}
		}

		return out;
	}

	async getForms(): Promise<{[key: string]: BasicForm}> {
		const forms: {[key: string]: BasicForm} = {};
		for (const [key, formKit] of Object.entries(this.getFormKits())) {
			forms[key] = await formKit.getForm();
		}

		return forms;
	}

	async performSave(forms: TFormsList = null) {
		if (!forms) {
			forms = this.forms;
		}

		const formKitsToBeSaved = _.pick(this.getFormKitsForSave(), Object.keys(forms));
		// eslint-disable-next-line
		for (const [formKey, formKit] of Object.entries(formKitsToBeSaved)) {
			await formKit.save();
		}

		//Get forms to set PK to child forms
		const formInstances = await this.getForms();
		for (const [key, val] of Object.entries(forms)) {
			//if there are children forms: run through them:
			if (!(val instanceof BasicForm) && _.isObject(val) && _.isObject(val.children)) {
				const form = formInstances[key];

				const childrenFormsToBeSaved = {};
				for (const [childKey, childVal] of Object.entries(val.children)) {
					if (childKey in formInstances) {
						const childForm = formInstances[childKey];
						childForm.setPk(form.getPk());
						await form.prepareChildForm(childForm);

						childrenFormsToBeSaved[childKey] = childVal;
					}
				}

				if (Object.keys(childrenFormsToBeSaved).length) {
					await this.performSave(childrenFormsToBeSaved);
				}
			}
		}
	}

	getFormKits(): {[key: string]: FormKit} {
		if (!this.formKits) {
			this.formKits = {};
			this.createFormKits();
		}

		return this.formKits;
	}

	createFormKits(forms: TFormsList = null) {
		if (!forms) {
			forms = this.forms;
		}

		for (const [key, val] of Object.entries(forms)) {
			if (key in this.formKits)
				throw new Error(`Key '${key}' is already in @formKits!`);

			let formOptions = {}, children, form;
			if (val instanceof BasicForm || _.isString(val)) {
				form = val;
			} else if (val.form) {
				form = val.form;

				if (val.options)
					formOptions = val.options;

				if (val.children)
					children = val.children;

			} else {
				throw new Error(`Incorrect form value for key '${key}'`);
			}

			this.formKits[key] = this.controller.createFormKit(form, formOptions);

			if (children) {
				this.createFormKits(children);
			}
		}
	}

	getFormKitsForSave(): {[key: string]: FormKit} {
		const out = {};

		const isPost = this.controller.isPostMethod();
		if (!isPost) {
			return out;
		}

		const object = this.getFormKits();
		for (const [key, kit] of Object.entries(object)) {
			if (
				!this.hasData(key) &&
				(this.config.skipSaveOnEmpty.includes(key) || this.config.skipSetupOnEmpty.includes(key))
			) {
				continue;
			}

			out[key] = kit;
		}

		return out;
	}

	getFormKitsForSetup(): {[key: string]: FormKit} {
		const out = {};

		const isPost = this.controller.isPostMethod();
		const object = this.getFormKits();
		for (const [key, kit] of Object.entries(object)) {
			if (
				(!isPost || !this.hasData(key)) &&
				this.config.skipSetupOnEmpty.includes(key)
			) {
				continue;
			}

			out[key] = kit;
		}

		return out;
	}

	hasData(formName: string) {
		const data = this.getData();

		return formName in data;
	}

	getData(formName: string = null) {
		let data;
		if (this.config.data) {
			({data} = this.config);
		} else {
			data = this.controller.getReqBody();
		}

		if (formName !== null) {
			//			add common data to each form:
			const commonData = formName !== '_common' ? this.getData('_common') : {};
			let formData = {};

			if (formName in data) {
				formData = data[formName];
			}

			Object.assign(formData, commonData);

			return formData;
		} else {
			return data;
		}
	}

	getFormsWithErrors() {
		return this.formsWithErrors;
	}

	async defaultSuccess(forms: {[key: string]: BasicForm}) {
		const result: IFormsGroupSuccessResult = {
			json: {
				forms: {},
				_common: {
					closeModal: true
				}
			}
		};

		if (this.config.successMsg !== false) {
			result.alert = {
				type: 'success',
				text: this.config.successMsg
			};
		}

		for (const key in forms) {
			const form = forms[key];
			result.json.forms[key] = {
				pk: form.getPk()
			};
		}

		if (result && 'alert' in result) {
			this.controller.addAlert(result.alert.text, result.alert.type);
		}

		if (this.config.successRedirect) {
			this.controller.metaRedirect(this.config.successRedirect);
		}

		if (_.isFunction(this.config.beforeJson)) {
			await this.config.beforeJson.call(this, result, true, this, forms);
		}

		if (result && 'json' in result) {
			this.controller.json(result.json);
		}
	}

	async notifyFormsSaveSuccess() {
		const forms = await this.getForms();
		// eslint-disable-next-line
		for (const [key, form] of Object.entries(forms)) {
			await form.onFormsGroupSaved();
		}
	}

	async notifyFormsSaveError() {
		const forms = await this.getForms();
		// eslint-disable-next-line
		for (const [key, form] of Object.entries(forms)) {
			await form.onFormsGroupSaveError();
		}
	}

	setupFormKitsData() {
		if (this.formKitsDataInited) {
			return;
		}

		this.formKitsDataInited = true;
		for (const [key, kit] of Object.entries(this.getFormKitsForSave())) {
			kit.setData(this.getData(key));
		}
	}

	async setupForms() {
		if (this.formsInited)
			return;

		this.formsInited = true;
		await this.processSetupForms();
	}

	async processSetupForms(formHierarchy: TFormsList | null = null) {
		if (formHierarchy === null) {
			formHierarchy = this.forms;
		}

		const formInstances: {[key: string]: BasicForm} = {};
		const formKits = this.getFormKitsForSetup();
		const formKitsToSetup = _.pick(formKits, _.keys(formHierarchy));

		for (const [key, formKit] of Object.entries(formKitsToSetup)) {
			formInstances[key] = await formKit.getForm();
		}

		//setup children
		for (const [key, formInstance] of Object.entries(formInstances)) {
			const formConfig = formHierarchy[key];

			if ((formConfig instanceof BasicForm) || !_.isObject(formConfig) || !_.isObject(formConfig.children))
				continue;

			// eslint-disable-next-line
			for (const [childKey, childVal] of Object.entries(formConfig.children)) {
				// skip formKits which are empty (skipOnEmpty).
				if (!(childKey in formKits)) continue;

				const childFormKit = formKits[childKey];
				await formInstance.setupChildFormKit(childFormKit);
			}

			await this.processSetupForms(formConfig.children);
		}
	}

	//	Resolves promise with data for web forms.
	async getWebForms() {
		const webForms = {};
		await this.setupForms();

		const object = this.getFormKitsForSetup();
		for (const [key, formKit] of Object.entries(object)) {
			webForms[key] = await formKit.getWebForm();
		}

		const data = {
			forms: webForms,
			buttons: this.getWebFormButtons(webForms)
		};

		return data;
	}

	getWebFormButtons(forms) {
		const keys = _.keys(this.forms);

		if ((keys.length > 0) && keys[0] in forms && !_.isUndefined(forms[keys[0]].buttons)) {
			// to prevent circular reference
			return _.extend({}, forms[keys[0]].buttons);
		} else {
			return {};
		}
	}
}

export interface IFormsGroupConfig {
	data: null | {[key: string]: any};
	success: () => void|Promise<void>;
	successMsg: false | string;
	successRedirect: string | string[] | false;
	errorAlert: boolean;
	skipSaveOnEmpty: string[],
	skipSetupOnEmpty: string[],
	beforeJson: null | ((result: IFormsGroupSuccessResult, closeModal: boolean, formGroup: FormsGroup, forms: {[key: string]: BasicForm}) => void|Promise<void>);
	forceCloseModal: boolean;
}

export interface IFormsGroupSuccessResult {
	json: {
		forms: {
			[formKey: string]: {
				pk: string | number
			}
		},
		_common: {
			closeModal: boolean;
		}
	},
	alert?: {
		type: string;
		text: string;
	}
}

export type TFormsList = {
	[formName: string]: string | {
		form: string,
		options?: Partial<IFormOptions>,
		children?: TFormsList
	}
};
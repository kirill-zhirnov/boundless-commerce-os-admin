import BasicController from '../basic';
import extend from 'extend';
import BasicForm, {IFormOptions} from '../../form';
import _ from 'underscore';

export default class FormKit {
	protected controller: BasicController;
	protected config: IFormKitConfig;
	protected form: BasicForm;
	protected pk: string|number|null;
	protected data: {[key: string]: any};
	protected attributesInited: boolean = false;

	constructor(controller: BasicController, config: Partial<IFormKitConfig> = {}) {
		this.controller = controller;

		this.config = extend(true, {
			form: undefined,
			formName: undefined,
			success: this.defaultSuccess,
			successMsg: this.controller.getI18n().__('Form was successfully saved.'),
			error: this.defaultError,
			errorAlert: true,
			options: null,
			data: undefined,
			scenario: null,
			successRedirect: null,
			forceCloseModal: false,
			beforeJson: null
		}, config);

	}

	async process() {
		try {
			await this.validate();
			await this.save();

			if (typeof(this.config.success) === 'function') {
				await this.config.success.call(this, this.form.getSafeAttrs(), this.form.getPk(), this, this.form);
			}
		} catch (e) {
			if (e instanceof Error) {
				throw e;
			}

			await this.config.error.call(this, this);
		}
	}

	async validate() {
		await this.getForm();
		this.setupAttributes();

		await this.form.validate();
	}

	async save() {
		const form = await this.getForm();
		this.setupAttributes();

		await form.save();
	}

	async getForm(): Promise<BasicForm> {
		if (this.form)
			return this.form;

		if (this.config.form instanceof BasicForm) {
			this.form = this.config.form;
		} else {
			this.form = this.controller.createForm(this.config.form, this.config.options);
		}

		this.form.setPk(this.getPk());
		this.form.setScenario(this.getScenario());

		await this.form.setup();

		return this.form;
	}

	async getWebForm() {
		const form = await this.getForm();
		const data = await form.getTplData();

		Object.assign(data, {
			buttons: {
				isNew: !data.pk
			}
		});

		return data;
	}

	getConfig() {
		return this.config;
	}

	getIsDraft() {
		const data = this.getData();

		if ('is_draft' in data && (data.is_draft === '1')) {
			return true;
		}

		return false;
	}

	setPk(pk) {
		this.pk = pk;
		return this;
	}

	getPk() {
		if (this.pk != null) {
			return this.pk;
		}

		const data = this.getData();

		if ('pk' in data && (data.pk !== '')) {
			return data.pk;
		}

//		PK usually not in data (POST), but in GET: @controller.getParam('pk')
		return this.controller.getParam('pk');
	}

	setScenario(scenario: null|string) {
		this.config.scenario = scenario;

		return this;
	}

	getScenario(): null|string {
		if (this.config.scenario) {
			return this.config.scenario;
		}

		return null;
	}

	defaultError() {
		if (this.config.errorAlert) {
			this.controller.alertDanger(this.controller.getI18n().__('Form contains errors!'));
		}

		return this.controller.jsonErrors({errors : this.form.getFormErrors()});
	}

	async defaultSuccess(safeAttrs, pk, formKit, form) {
		const result: IDefaultSuccessResult = {
			json: {
				pk
			}
		};

		if (this.config.successMsg !== false) {
			result.alert = {
				type: 'success',
				text: this.config.successMsg
			};
		}

		const closeModal = this.config.forceCloseModal || this.shallCloseModal();
		if (closeModal != null) {
			result.json.closeModal = closeModal;
		}

		if (this.config.successRedirect && closeModal) {
			this.controller.metaRedirect(this.config.successRedirect);
		}

		if (_.isFunction(this.config.beforeJson)) {
			await this.config.beforeJson.call(this, result, closeModal, this, form);
		}

		if (result && 'alert' in result) {
			this.controller.addAlert(result.alert.text, result.alert.type);
		}

		if (result && 'json' in result) {
			 this.controller.json(result.json);
		}
	}

	shallCloseModal() {
		return true;
	}

	setData(data) {
		this.config.data = data;
		this.data = null;

		return this;
	}

	getData(): {[key: string]: any} {
		if (this.data)
			return this.data;

		if (this.config.data) {
			this.data = this.config.data;
		} else {
			if (this.config.formName) {
				this.data = this.controller.getReqBody()[this.config.formName] || {};
			} else {
				this.data = this.controller.getReqBody();
			}
		}

		if (!('status' in this.data)) {
			this.data.status = this.getIsDraft() ? 'draft' : 'published';
		}

		return this.data;
	}

	setupAttributes() {
		if (this.attributesInited)
			return;

		this.attributesInited = true;
		this.form.setAttributesOnSubmit(this.getData());
	}

	success(callback: (...args: any) => void) {
		this.config.success = callback;

		return this;
	}

	setOptions(options) {
		this.config.options = options;

		return this;
	}

	async getFormErrors() {
		const form = await this.getForm();
		return form.getFormErrors();
	}
}

export interface IFormKitConfig {
	form: BasicForm|string|null,
	formName?: string,
	success: (...args: any) => void|Promise<void>;
	successMsg: string|false;
	error: (...args: any) => void;
	errorAlert: boolean;
	options: null|Partial<IFormOptions>,
	data?: {[key: string]: any},
	scenario: null|string,
	successRedirect: null|string[]|string,
	forceCloseModal: boolean;
	beforeJson: (result: IDefaultSuccessResult, closeModal: boolean, formKit: FormKit, form: BasicForm) => void|null|Promise<void>
}

export interface IDefaultSuccessResult {
	json: {
		pk: string|number|null;
		closeModal?: boolean;
	};
	alert?: {
		type: string,
		text: string
	}
}
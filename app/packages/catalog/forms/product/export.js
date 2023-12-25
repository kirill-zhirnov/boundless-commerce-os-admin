import Form from '../../../../modules/form/index';

export default class ProductExportForm extends Form {
	constructor(options) {
		super(options);

		this.grid = options.grid;
		this.export = options.export;
		this.downloadRedirect = null;
	}

	getRules() {
		return [
			['type', 'required'],
			['type', 'inOptions', {options: 'type'}],
			['descriptionAsHtml', 'safe']
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const getParams = {
			export: this.export,
			grid: this.grid,
		};

		const exportSettings = {
			descriptionAsHtml: (attrs.descriptionAsHtml == '1') ? 1 : 0
		};

		//its a hack for passing attributes into data-provider, we need to solve it in future
		Object.assign(getParams.grid, exportSettings);

		switch (attrs.type) {
			case 'products':
				this.downloadRedirect = this.url('catalog/admin/product/export/downloadProducts', getParams);
				break;

			case 'productsAndVariants':
				this.downloadRedirect = this.url('catalog/admin/product/export/downloadProductsAndVariants', getParams);
				break;
		}
	}

	getDownloadRedirect() {
		return this.downloadRedirect;
	}

	async getTplData() {
		const out = await super.getTplData();

		//@ts-ignore
		out.grid = this.grid;
		//@ts-ignore
		out.export = this.export;

		return out;
	}

	getDefaultAttrs() {
		return {
			type: 'products',
			descriptionAsHtml: 0
		};
	}

	rawOptions() {
		return {
			type: [
				['products', ''],
				['productsAndVariants', ''],
			],
		};
	}
}
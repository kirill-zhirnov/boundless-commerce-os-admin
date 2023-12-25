import Widget from '../../../modules/widget/widget.client';

export default class Order extends Widget {
	attributes() {
		return {
			class: 'view-order-widget'
		};
	}

	async run() {
		return this.render(this.getTpl());
	}

	getTpl() {
		if (!this.data.tpl) {
			return 'order';
		}

		return `order/${this.data.tpl}`;
	}

	getFileName() {
		return __filename;
	}
}
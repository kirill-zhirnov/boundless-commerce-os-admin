import $ from 'jquery';
import FormWidget from '../../../modules/widget/form.client';

export default class OrderStatusColorForm extends FormWidget {
	attributes() {
		return {
			action: this.url('orders/admin/setup/orderStatus/form'),
			class: 'form-orders-status'
		};
	}

	run() {
		return this.render('orderStatusColorForm', this.data);
	}

	events() {
		return Object.assign(super.events(), {
			'click ul > li': (e) => {
				let color = $(e.currentTarget).css('background-color');
				color = this.rgb2hex(color);
				this.$('input[name=background_color]').val(color);
				this.$('.color-current').css('background-color', color);
			}
		});
	}

	rgb2hex(rgb) {
		rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
		const hex = x => ('0' + parseInt(x).toString(16)).slice(-2);
		return '#' + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
	}

	getFileName() {
		return __filename;
	}
}
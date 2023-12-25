import Widget from '../../../modules/widget/widget.client';

export default class LabelColorForm extends Widget {
	run() {
		return this.render('labelColorForm', this.data);
	}

	events() {
		return {
			'click ul > li': 'onColorSelect'
		};
	}

	onColorSelect(e) {
		let color = this.$(e.currentTarget).css('background-color');
		color = this.rgb2hex(color);
		this.$('input[name=color]').val(color);
		return this.$('.color-current').css('background-color', color);
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
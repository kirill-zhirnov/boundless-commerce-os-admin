import Widget from '../../../modules/widget/widget.client';

export default class ContentLoader extends Widget {
	attributes() {
		let out = {
			class: 'content-loader'
		};

		if (this.data.height) {
			out.style = `height: ${this.data.height}px;`
		}

		return out;
	}

	run() {
		return this.render('contentLoader');
	}

	getFileName() {
		return __filename;
	}
}
let Nanobar;
import Widget from '../../../modules/widget/widget.client';
import $ from 'jquery';

if (!process.env.__IS_SERVER__) {
	Nanobar = require('nanobar');
}

export default class LoadingLine extends Widget {
	constructor(options) {
		super(options);

		this.nanoBar = null;
		this.percentage = 0;
		this.$bar = null;
		this.endTimer = null;
	}

	runLazyInit() {
		this.nanoBar = new Nanobar({});

		this.$bar = $('body > .nanobar');
		this.listenTo$(document, 'showAjaxLoading.theme', () => {
			if (this.endTimer) {
				clearInterval(this.endTimer);
				this.endTimer = null;
			}

			this.go(30);
		});

		return this.listenTo$(document, 'hideAjaxLoading.theme', () => {
			if (this.endTimer) {
				clearInterval(this.endTimer);
			}

			this.endTimer = setTimeout(() => this.go(100), 300);
		});
	}

	go(step) {
//		if percentage is not null and more than passed step - there is a parallel request - return
		if (this.percentage >= step) {
			step = this.percentage + 5;
		}

		if (this.$bar.find('.bar').length > 1) {
			this.$bar.find('.bar:lt(1)').remove();
		}

		this.percentage = step >= 100 ? 0 : step;

		return this.nanoBar.go(step);
	}

	getFileName() {
		return __filename;
	}
}
import Widget from '../../../modules/widget/widget.client';
import $ from 'jquery';
import bsGHtml from '../../../modules/gHtml/bs.client';

export default class Alerts extends Widget {
	runLazyInit() {
		this.listenTo$(document, 'alert.theme', (e, text, type) => this.showAlert(text, type));
	}

	attributes() {
		return {
			class: 'alerts-container'
		};
	}

	events() {
		return {
			'click .btn-close': (e) => {
				e.preventDefault();
				this.hideAlert($(e.currentTarget).parents('.alert'));
			}
		};
	}

	showAlert(text, type) {
		const $alert = $(this.getTpl(text, type));
		this.$el.append($alert);

		$alert.animate({
			opacity: 1
		}, 'fast', 'swing', () => this.startHideTimer($alert));
	}

	hideAlert($alert) {
		$alert.animate({
			opacity: 0
		}, 'fast', 'swing', () => $alert.remove());
	}

	startHideTimer($alert) {
		setTimeout(() => {
			if ($.contains(document.body, $alert.get(0))) {
				this.hideAlert($alert);
			}
		}, 4000);
	}

	getTpl(text, type) {
		return bsGHtml.alert(
			type,
			`${text} ${bsGHtml.closeIcon({'data-bs-dismiss': 'alert'})}`,
			{class: 'alert-dismissible'}
		);
	}

	getFileName() {
		return __filename;
	}
}
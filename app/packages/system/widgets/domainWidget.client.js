import FormWidget from '../../../modules/widget/form.client';
import _ from 'underscore';

export default class DomainWidget extends FormWidget {
	run() {
		return this.render('domainForm');
	}

	runLazyInit() {
		return this.checkRestoreVisibility();
	}

	attributes() {
		return _.extend(super.attributes(), {
			action : this.url('system/admin/domain/index'),
			class : 'domain-form',
			method : 'POST'
		});
	}

	events() {
		const events = super.events();

		events['click .edit'] = 'onEditClicked';
		events['keydown #domain'] = 'onKeyDown';

		return events;
	}

	onKeyDown(e) {
		if (e.keyCode === 13) {
			return this.onSubmit();
		}
	}

	onEditClicked(e) {
		e.preventDefault();

		this.$('#domain').removeAttr('readonly').get(0).focus();
		return this.$('button.save').removeClass('hidden');
	}

	processSuccessResult(data, refreshGrid) {
		if (refreshGrid == null) { refreshGrid = true; }
		this.$('#domain').attr('readonly', 'readonly');
		this.$('button.save').addClass('hidden');

		this.checkRestoreVisibility();

		return super.processSuccessResult(data, refreshGrid);
	}

	checkRestoreVisibility() {
		const $el = this.$('.restore-default');
		if (this.$('#domain').val() !== this.$('#internal').val()) {
			return $el.show();
		} else {
			return $el.hide();
		}
	}

	getFileName() {
		return __filename;
	}
}

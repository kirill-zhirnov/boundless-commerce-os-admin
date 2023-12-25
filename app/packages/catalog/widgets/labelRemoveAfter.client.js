import Widget from '../../../modules/widget/widget.client';

export default class LabelRemoveAfter extends Widget {
	run() {
		return this.render('labelRemoveAfter', {data: this.data});
	}

	events() {
		return {
			'click input[name="removeAfter"]' : 'onSelect'
		};
	}

	onSelect(e) {
		if (e.currentTarget.checked) {
			return this.$('.day-input').show();
		} else {
			this.$('.day-input').hide();
			return this.$('.day-input input').val('');
		}
	}

	getFileName() {
		return __filename;
	}
}
import FormWidget from '../../../modules/widget/form.client';
import $ from 'jquery';

export default class TrackNumberForm extends FormWidget {
	attributes() {
		return Object.assign(super.attributes(), {
			name: 'trackNumber',
			class: 'track-number-form'
		});
	}

	events() {
		return Object.assign(super.events(), {
			'click .add': (e) => {
				e.preventDefault();

				const sample = this.$('.sample').clone().removeClass('none sample').addClass('is-new');
				sample.find('input').attr('name', `track_number[new${this.$('.is-new').length}]`);
				sample.appendTo('.list-wrapper');
			},
			'click .rm': (e) => {
				e.preventDefault();
				$(e.currentTarget).parents('.form-group:eq(0)').remove();
			}
		});
	}

	run() {
		return this.render('trackNumberForm', this.data);
	}

	getFileName() {
		return __filename;
	}
}
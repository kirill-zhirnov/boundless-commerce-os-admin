// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const pathAlias = require('path-alias');
const Modal = pathAlias('@modules/modal/modal.@c');
const _ = require('underscore');

class ChoosePoint extends Modal {
	attributes() {
		return _.extend(super.attributes(...arguments), {
			'class' : 'modal choose-point'
		});
	}

	events() {
		return _.extend(super.events(...arguments), {
			"change input[name='point']" : "onPointSelect"
		});
	}

	onPointSelect(e) {
		const $el = this.$("input[name='point']:checked");

		if ($el.length === 0) {
			return;
		}

		const data = {
			id : $el.val(),
			title : $el.parents('.list-group-item-heading:eq(0)').text(),
			address : $el.parents('.list-group:eq(0)').find('address').text()
		};

		this.$('.choose-pickup-point-form').trigger('pickupPointSelected.form', [data]);

		return this.close();
	}
}
	
module.exports = ChoosePoint;
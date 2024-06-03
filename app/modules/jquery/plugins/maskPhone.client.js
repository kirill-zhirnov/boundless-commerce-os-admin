import {clientRegistry} from '../../registry/client/client.client';

export default function($) {
	$.fn.maskPhone = function() {
		const locale = clientRegistry.getLocale();
		const mask = locale.getPhone().mask;

		return this.each(function() {
			if (mask !== null && mask !== '') {
				$(this).mask(mask, {
					translation: {
						'P': {
							pattern: /\+/
						},
						'X': {
							pattern: /\d/,
							optional: true
						}
					},
					onInvalid: function(val, e, field, invalid, options) {
						let err = invalid[0];
						let $el = $(field);

						//if position is 0:
						if (err.p == 0 && $el.val() == '') {
							let set = null;

							// if (err.v == '8' || err.v == '7') {
							// 	set = '+7';
							// } else {
							set = '+' + err.v;
							// }

							if (set !== null) {
								$el.val(set);
							}
						}
					}
				});
			}
		});
	};
}
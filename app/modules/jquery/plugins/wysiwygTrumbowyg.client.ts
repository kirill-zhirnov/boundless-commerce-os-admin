import $ from 'jquery';
import _ from 'underscore';
import utils from '../../utils/common.client';

import 'trumbowyg/dist/trumbowyg.min.js';
import 'trumbowyg/dist/ui/trumbowyg.min.css';

import 'trumbowyg/dist/plugins/colors/trumbowyg.colors.min.js';
import 'trumbowyg/dist/plugins/colors/ui/trumbowyg.colors.min.css';

//@ts-ignore
$.trumbowyg.svgAbsoluteUsePath = true;

const setupEditor = function(el: HTMLTextAreaElement, options: IWysiwygOptions = {}) {
	//@ts-ignore
	$(el).trumbowyg({
		svgPath: utils.getGlobalStaticUrl('/images/thumbowyg-icons.svg', true, true),
		btnsDef: {
			align: {
				dropdown: ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
				ico: 'justifyLeft'
			}
		},
		btns: [
			['viewHTML'],
			['undo', 'redo'], // Only supported in Blink browsers
			['formatting'],
			['strong', 'em', 'del', 'underline'],
			['foreColor', 'backColor'],
			['link'],
			['insertImage'],
			['align'],
			['unorderedList', 'orderedList'],
			['horizontalRule'],
			['removeformat'],
			['fullscreen']
		]
	});

	$(el).on('tbwchange', () => {
		//@ts-ignore
		$(el).trigger('changed.editor', $(el).trumbowyg('html'));
	});
};

export default function($) {
	$.fn.wysiwyg = function(action: TWysiwygAction|IWysiwygOptions, options?: IWysiwygOptions) {
		if (action == 'getValue') {
			return $(this.get(0)).trumbowyg('html');
		}

		this.each((i: number, el: HTMLTextAreaElement) => {
			switch (action) {
				case 'rm':
					$(el).trumbowyg('destroy');
					break;
				case 'setValue':
					$(el).trumbowyg('html', options);
					break;
				case 'setup':
				default: {
					if (_.isObject(action) && !options) {
						options = action;
					}

					if (!options) {
						options = {};
					}

					setupEditor(el, options);
					break;
				}
			}
		});

		return this;
	};
}

type TWysiwygAction = 'rm' | 'setValue' | 'setup';

interface IWysiwygOptions {}
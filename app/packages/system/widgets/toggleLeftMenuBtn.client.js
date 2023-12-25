import Widget from '../../../modules/widget/widget.client';
import gHtml from '../../../modules/gHtml/index.client';
import $ from 'jquery';
import ajax from '../../../modules/ajax/kit.client';

const fullClass = 'ico_chevron-left';
const shortClass = 'ico_menu';

export default class ToggleLeftMenuBtn extends Widget {
	constructor(options) {
		super(options);

		this.tagName = 'a';
	}

	attributes() {
		return {
			href: '#',
			class: 'btn custom-btn custom-btn_icon-square d-none d-xl-flex'
		};
	}

	run() {
		this.data.leftSideBar = this.getView().getGlobalViewData('leftSideBar');
		return this.wrapInWrapper(this.getBtnContent());
	}

	events() {
		return {
			'click': (e) => {
				e.preventDefault();

				this.data.leftSideBar = (this.data.leftSideBar === 'full') ? 'short' : 'full';
				$('body').trigger('toggled.adminMenu', [this.data.leftSideBar]);

				this.$el.html(this.getBtnContent());

				ajax.post(['auth/settings/adminLeftSidebar'], {value: this.data.leftSideBar}, {hidden: true});
			}
		};
	}

	getBtnContent() {
		let cls = (this.data.leftSideBar === 'full') ? fullClass : shortClass;
		return gHtml.tag('span', {
			class: `ico ico_size_20 ${cls}`
		});
	}

	getFileName() {
		return __filename;
	}
}
import BackTree from 'backbone-tree-view';
import gHtml from '../../../../@types/gHtml/index.client';
import {clientRegistry} from '../../../../modules/registry/client/client.client';

const btnClasses = 'btn btn-sm btn-default';

class ItemSimple extends BackTree.Item {
	getRightPart() {
		let out = gHtml.link(gHtml.faIcon('pencil'), '#', {
			class: btnClasses,
			'data-mode': 'edit',
			'data-id': this.model.get('id')
		});

		out += ' ';
		out += gHtml.link(gHtml.faIcon('eye-slash'), '#', {
			class: btnClasses,
			'data-mode': 'remove',
			'data-id': this.model.get('id')
		});

		return out;
	}

	getBodyPart() {
		const i18n = clientRegistry.getI18n();

		const titleClasses = ['title'];
		const title = this.model.get('title');

		let customLink = '';
		if (this.model.get('custom_link')) {
			customLink = `<sup>${i18n.__('Custom link')}</sup>`;
		}

		return gHtml.tag('span', {class: titleClasses.join(' ')}, `${title} ${customLink}`);
	}
}

module.exports = ItemSimple;
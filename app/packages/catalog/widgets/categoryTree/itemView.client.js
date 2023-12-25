import BackTree from 'backbone-tree-view';
import gHtml from '../../../../modules/gHtml/index.client';
import {getImgCloudUrl} from '../../../../modules/s3Storage/cloudUrl';


const btnClasses = 'btn btn-sm btn-outline-secondary';

export default class Item extends BackTree.Item {
	getRightPart() {
		let out = '';

		// if (!this.model.get('deleted_at')) {
		// 	out += gHtml.link(gHtml.faIcon('external-link'), this.model.get('url'), {
		// 		class: btnClasses,
		// 		'data-mode': 'view',
		// 		target: '_blank'
		// 	});
		// }

		out += ' ' + gHtml.link(
			gHtml.faIcon('pencil'),
			'#',
			{
				class: btnClasses,
				'data-mode': 'edit',
				'data-id': this.model.get('id')
			}
		);

		return out;
	}

	getBodyPart() {
		const titleClasses = ['title', 'd-inline-flex', 'align-items-center'];

		const title = this.model.get('title');
		let preffix = '';
		let suffix = '';
		let image = '';
		const image_path = this.model.get('image');

		if (image_path) {
			image = gHtml.tag(
				'div',
				{class: 'me-2', style: `width: 30px; height: 30px; display: inline-block; background-image: url("${getImgCloudUrl(image_path, 40)} ")`},
				''
			);
		}

		if (this.model.get('status') === 'hidden') {
			preffix = gHtml.faIcon('eye-slash', {class: 'me-2'});
		} else {
			// if (this.model.get('in_menu')) {
			// 	icon = gHtml.faIcon('link');
			// }

			if (this.model.get('custom_link')) {
				suffix = gHtml.faIcon('anchor', {class: 'ms-2'});
			}
		}

		return gHtml.tag(
			'span',
			{class: titleClasses.join(' ')},
			`${preffix} ${image} ${title} ${suffix}`
		);
	}

	setupClassNames() {
		super.setupClassNames(...arguments);

		const classes = [''];
		if (this.model.get('status') === 'hidden') {
			classes.push('is-hidden');
		}

		if (!this.model.get('in_menu')) {
			classes.push('not-in-menu');
		}

		return this.$el.addClass(classes.join(' '));
	}
}
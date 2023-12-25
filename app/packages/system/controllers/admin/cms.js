import BasicAdmin from '../admin';
import _ from 'underscore';

export default class CmsController extends BasicAdmin {
	async actionSeo() {
		const group = this.createFormsGroup({
			mainPageSeo: {
				form: '@p-cms/forms/admin/mainPageSeo',
				children: {
					// openGraph: '@p-system/forms/openGraph',
					// robots: '@p-system/forms/robots',
					// headerInjection: '@p-system/forms/headerInjection',
					// semanticMarkup: '@p-system/forms/semanticMarkup',
					seoTpl: '@p-system/forms/admin/seoTemplates'
				}
			}
		});

		if (this.isSubmitted()) {
			await group.process();
		} else {
			// let data = null;
			const data = await group.getWebForms();
			const oldFav = await this.getSetting('system', 'favicon');
			const newFav = await this.getSetting('system', 'faviconNew');

			let fav = null;
			if (newFav && newFav['android-chrome-192x192.png']) {
				fav = this.getInstanceRegistry().getMediaUrl(
					newFav['android-chrome-192x192.png']
				);
			} else if (oldFav) {
				fav = this.getInstanceRegistry().getMediaUrl(oldFav);
			}

			//@ts-ignore
			data.forms.favicon = {
				favicon: fav,
				isBackend: true
			};

			//@ts-ignore
			_.extend(data.buttons, {
				isNew: false,
				buttons: ['save']
			});

			this.setPage('title', this.__('SEO templates'));
			this.render('seoForm', data);
		}
	}

	async actionMainPageSeo() {
		const formKit = this.createFormKit('@p-cms/forms/admin/mainPageSeo', {}, {
			success: (safeAttrs, pk) => {
				const result = {
					pk,
					changedFiles: [],
					closeModal: true
				};

				return this.json(result);
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.modal('mainPageSeo', {data}, this.__('Main page SEO'));
		}
	}

	async actionOpenGraphUpload() {
		const formKit = this.createFormKit('@p-system/forms/openGraphImageUploader', {}, {
			beforeJson(result, closeModal, formKit) {
				//@ts-ignore
				result.json.uploadedData = formKit.form.getUploadedFileSrc();
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			throw new Error('Method only for post!');
		}
	}

	actionSwitcherBarSetting() {
		const opt = this.getParam('showSwitcherBar') === 'false' ? false : true;

		this.getUser().setSetting('showSwitcherBar', opt);
		this.json(true);
	}
}
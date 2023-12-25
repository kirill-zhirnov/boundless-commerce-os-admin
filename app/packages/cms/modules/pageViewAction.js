// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const _ = require('underscore');

class PageViewAction {
	constructor(controller) {
		this.controller = controller;
		this.page = null;
		this.clientRegistry = this.controller.getClientRegistry();
		this.i18n = this.controller.getI18n();
	}

	proceed(id = null, isMainPage) {
		if (isMainPage == null) { isMainPage = false; }
		const pageId = id || this.controller.getParam('id');
		return this.controller.getModel('page').loadPage(this.clientRegistry.getSite().site_id, this.clientRegistry.getLang().lang_id, pageId)
		.then(page => {
			if (page) {
				this.page = page;

				if ((this.page.url_key != null) && (String(this.page.page_id) === String(pageId)) && !isMainPage) {
					this.controller.redirect(['@page', {id:this.page.url_key}]);
					return false;
				}

				if (this.page.type === 'folder') {
					this.controller.rejectHttpError(404, this.i18n.__('Page not found!'));
					return false;
				}

				return true;
			} else {
				this.controller.rejectHttpError(404, this.i18n.__('Page not found!'));
				return false;
			}
	}).then(result => {
			if (result === false) {
				return;
			}

			this.setupPageMeta();

			const pageRow = _.pick(this.page, ['page_id', 'title', 'url_key']);
			pageRow.url = this.controller.url.apply(this.controller, this.page.urlArgs);

			_.extend(pageRow, _.pick(this.page.pageProp, [
				'custom_header',
				'custom_title',
				'meta_description',
				'meta_keywords'
			])
			);

			this.controller.htmlClasses.push('page-layout');
//			turn on animation for pages and landings
			this.controller.setPage('aos', true);

			if (this.controller.isEditMode() && !isMainPage) {
				this.controller.triggerClient('opened.editableIframe', {
					type : 'page',
					id : this.page.page_id
				});
			}

			if (this.page.type === 'landing') {
				this.controller.isLanding = true;
				this.controller.setLayout(`$landings/page${this.page.page_id}`);
			} else {
				this.controller.setLayout(`$pages/page${this.page.page_id}`);
			}

//				@controller.setLayoutData 'pageRow', pageRow
//				@controller.setLayoutData 'isAllowEdit', isAllowEdit

			if (this.controller.getParam('layoutEditMode')) {
				this.controller.setPage('robots', 'noindex');
			}

			this.controller.setResponseType('layout');
			return this.controller.resolve();
			}).done();
	}


	setupPageMeta() {
		this.controller.setPage('title', this.page.title);
		this.controller.setPage('header', this.page.title);

		if (this.page.pageProp.custom_title != null) {
			this.controller.setPage('title', this.page.pageProp.custom_title);
		}

		if (this.page.pageProp.custom_header != null) {
			this.controller.setPage('header', this.page.pageProp.custom_header);
		}

		if (this.page.pageProp.meta_description != null) {
			this.controller.setPage('description', this.page.pageProp.meta_description);
		}

		if (this.page.pageProp.meta_keywords != null) {
			this.controller.setPage('keywords', this.page.pageProp.meta_keywords);
		}

		return this.controller.getResponse().setWrapperData('canonical', this.controller.url('@page', {id: this.page.url_key}, true));
	}


	isAllowEdit() {
		return this.controller.getUser().isAdmin();
	}
}

module.exports = PageViewAction;

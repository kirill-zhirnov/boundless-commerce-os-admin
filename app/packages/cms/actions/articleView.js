// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const Q = require('q');
const _ = require('underscore');
const pathAlias = require('path-alias');

class ArticleViewAction {
	constructor(controller) {
		this.controller = controller;
		this.clientRegistry = this.controller.getClientRegistry();
		this.i18n = this.controller.getI18n();
	}

	proceed() {
		let article = null;

		const articleId = this.controller.getParam('id');
		return this.controller.getModel('article').loadArticle(this.controller.getInstanceRegistry(), this.clientRegistry.getSite().site_id, this.clientRegistry.getLang().lang_id, articleId)
		.then(a => {
			if (a) {

				if ((a.url_key != null) && (String(a.article_id) === String(articleId))) {
					this.controller.redirect(['@blog', {id:a.url_key}]);
					return false;
				}

				article = a;
				article.currentUrl = this.controller.url(`blog/${articleId}`);

				return this.controller.getInstanceRegistry().getSettings().get('cms', 'blog');
			} else {
				this.controller.rejectHttpError(404, this.i18n.__('Page not found!'));
				return false;
			}
	}).then(blogSettings => {
			if (blogSettings === false) {
				return;
			}

			const isAllowEdit = this.isAllowEdit();
			this.controller.setLayoutData('breadCrumbs', this.getBreadCrumbs(blogSettings.title || this.i18n.__('Blog'), article));
			this.controller.getResponse().setWrapperData( 'canonical', this.controller.url('@blog', {id: article.url_key}, true));

			if ((article.image != null ? article.image.m : undefined) != null) {
				this.controller.getResponse().setWrapperData('openGraphImg', article.image.m.src);
			}

			article.isAllowEdit = isAllowEdit;

			this.setupBlogMeta(blogSettings, article.title);

			return this.controller.render('article', article);
			}).done();
	}

	setupBlogMeta(blogSettings, articleTitle) {
		this.controller.setPage('title', articleTitle || blogSettings.title || this.i18n.__('Blog'));
		this.controller.setPage('header', articleTitle || blogSettings.header || this.i18n.__('Blog'));
		this.controller.setPage('description', blogSettings.description);
		this.controller.setPage('keywords', blogSettings.keywords);

	}

	isAllowEdit() {
		return this.controller.getUser().isAdmin();
	}

	getBreadCrumbs(blogTitle, article) {
		return [
			{
				url: this.controller.url('blog'),
				title: blogTitle
			},
			{
				url: article.currentUrl,
				title: article.title,
				isActive: true
			}
		];
	}
}

module.exports = ArticleViewAction;
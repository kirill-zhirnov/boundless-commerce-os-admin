Q = require 'q'
_ = require 'underscore'
pathAlias = require 'path-alias'

class ArticleViewAction
	constructor : (@controller) ->
		@clientRegistry = @controller.getClientRegistry()
		@i18n = @controller.getI18n()

	proceed : () ->
		article = null

		articleId = @controller.getParam('id')
		@controller.getModel('article').loadArticle @controller.getInstanceRegistry(), @clientRegistry.getSite().site_id, @clientRegistry.getLang().lang_id, articleId
		.then (a) =>
			if a

				if a.url_key? && String(a.article_id) == String(articleId)
					@controller.redirect ['@blog', {id:a.url_key}]
					return false

				article = a
				article.currentUrl = @controller.url "blog/#{articleId}"

				return @controller.getInstanceRegistry().getSettings().get('cms', 'blog')
			else
				@controller.rejectHttpError 404, @i18n.__('Page not found!')
				return false
		.then (blogSettings) =>
			if blogSettings is false
				return

			isAllowEdit = @isAllowEdit()
			@controller.setLayoutData 'breadCrumbs', @getBreadCrumbs(blogSettings.title || @i18n.__('Blog'), article)
			@controller.getResponse().setWrapperData( 'canonical', @controller.url('@blog', {id: article.url_key}, true))

			if article.image?.m?
				@controller.getResponse().setWrapperData 'openGraphImg', article.image.m.src

			article.isAllowEdit = isAllowEdit

			@setupBlogMeta(blogSettings, article.title)

			@controller.render 'article', article
		.done()

	setupBlogMeta : (blogSettings, articleTitle) ->
		@controller.setPage 'title', articleTitle || blogSettings.title || @i18n.__('Blog')
		@controller.setPage 'header', articleTitle || blogSettings.header || @i18n.__('Blog')
		@controller.setPage 'description', blogSettings.description
		@controller.setPage 'keywords', blogSettings.keywords

		return

	isAllowEdit : ->
		return @controller.getUser().isAdmin()

	getBreadCrumbs : (blogTitle, article) ->
		return [
			{
				url: @controller.url 'blog'
				title: blogTitle
			},
			{
				url: article.currentUrl
				title: article.title
				isActive: true
			}
		]

module.exports = ArticleViewAction
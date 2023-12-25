_ = require 'underscore'

class PageViewAction
	constructor : (@controller) ->
		@page = null
		@clientRegistry = @controller.getClientRegistry()
		@i18n = @controller.getI18n()

	proceed : (id = null, isMainPage = false) ->
		pageId = id || @controller.getParam('id')
		@controller.getModel('page').loadPage @clientRegistry.getSite().site_id, @clientRegistry.getLang().lang_id, pageId
		.then (page) =>
			if page
				@page = page

				if @page.url_key? && String(@page.page_id) == String(pageId) && !isMainPage
					@controller.redirect ['@page', {id:@page.url_key}]
					return false

				if @page.type == 'folder'
					@controller.rejectHttpError 404, @i18n.__('Page not found!')
					return false

				return true
			else
				@controller.rejectHttpError 404, @i18n.__('Page not found!')
				return false
		.then (result) =>
			if result is false
				return

			@setupPageMeta()

			pageRow = _.pick(@page, ['page_id', 'title', 'url_key'])
			pageRow.url = @controller.url.apply @controller, @page.urlArgs

			_.extend pageRow, _.pick(@page.pageProp, [
				'custom_header',
				'custom_title',
				'meta_description',
				'meta_keywords'
			])

			@controller.htmlClasses.push 'page-layout'
#			turn on animation for pages and landings
			@controller.setPage 'aos', true

			if @controller.isEditMode() && !isMainPage
				@controller.triggerClient 'opened.editableIframe', {
					type : 'page'
					id : @page.page_id
				}

			if @page.type == 'landing'
				@controller.isLanding = true
				@controller.setLayout "$landings/page#{@page.page_id}"
			else
				@controller.setLayout "$pages/page#{@page.page_id}"

#				@controller.setLayoutData 'pageRow', pageRow
#				@controller.setLayoutData 'isAllowEdit', isAllowEdit

			if @controller.getParam('layoutEditMode')
				@controller.setPage('robots', 'noindex')

			@controller.setResponseType 'layout'
			@controller.resolve()
		.done()


	setupPageMeta : ->
		@controller.setPage 'title', @page.title
		@controller.setPage 'header', @page.title

		if @page.pageProp.custom_title?
			@controller.setPage 'title', @page.pageProp.custom_title

		if @page.pageProp.custom_header?
			@controller.setPage 'header', @page.pageProp.custom_header

		if @page.pageProp.meta_description?
			@controller.setPage 'description', @page.pageProp.meta_description

		if @page.pageProp.meta_keywords?
			@controller.setPage 'keywords', @page.pageProp.meta_keywords

		@controller.getResponse().setWrapperData('canonical', @controller.url('@page', {id: @page.url_key}, true))


	isAllowEdit : ->
		return @controller.getUser().isAdmin()

module.exports = PageViewAction

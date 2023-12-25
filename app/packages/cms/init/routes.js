export default function (router) {
	router.addRoute('page/:id', 'cms/page/view');
	router.addAlias('page', 'cms/page/view');

	router.addRoute('blog', 'cms/blog/index');
	router.addRoute('blog/:id', 'cms/blog/view');
	return router.addAlias('blog', 'cms/blog/view');
}
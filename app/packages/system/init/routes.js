export default function (router) {
	router.addRoute('search', 'system/search/site');
	router.addRoute('robots.txt', 'system/cms/robots');
	router.addRoute('edost.txt', 'system/cms/edost');
	router.addRoute('sitemap.xml', 'system/cms/siteMap');
	router.addRoute('getTpl', 'system/tpl/getTpl');
	router.addRoute('getTplBundle', 'system/tpl/getTplBundle');
	router.addRoute('browserconfig.xml', 'system/favicon/browserConfig');
	router.addRoute('site.webmanifest', 'system/favicon/webManifest');
}
export default function(router) {
	router.addAlias('product-admin-form', 'catalog/admin/product/form');
	router.addAlias('category', 'catalog/category/view');
	router.addAlias('product', 'catalog/product/view');
	router.addAlias('brand', 'catalog/manufacturer/view');

	router.addRoute('category/:id', 'catalog/category/view');
	router.addRoute('product/:id', 'catalog/product/view');
	router.addRoute('brand/:id', 'catalog/manufacturer/view');

	router.addRoute('feeds/google-merchant.xml', 'catalog/feed/google');
}
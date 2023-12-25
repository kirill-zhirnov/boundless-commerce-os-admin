export default function (router) {
	router.addAlias('admin-dashboard', 'dashboard/admin/index');
	router.addAlias('client-manager-dashboard', 'catalog/admin/product/index');
	router.addAlias('orders-manager-dashboard', 'orders/admin/orders/index');
	router.addAlias('client-dashboard', 'dashboard/client/index');
}
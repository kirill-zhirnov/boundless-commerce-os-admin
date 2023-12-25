
module.exports = {
	shouldBeResolved: {
		modules : 'app/modules',
		errors : 'app/modules/errors/errors',
		registry : 'app/modules/registry/server/instance',
		wrapperRegistry : 'app/modules/registry/server/wrapper',
		basicController : 'app/modules/controller/basic',
		basicAdmin : 'app/packages/system/controllers/admin',
		bb : 'app/modules/backbone/index.client',
		widget : 'app/modules/widget/widget.client',
		gridWidget : 'app/packages/system/widgets/grid.client',
		ajax : 'app/modules/ajax/kit.client',
		'bb-resource' : 'app/modules/controller/resources/backbone',
		'grid-resource' : 'app/modules/controller/resources/grid',
		utils : 'app/modules/utils/common.client',
		vue : 'app/vue',

		'p-auth': 'app/packages/auth',
		'p-catalog': 'app/packages/catalog',
		'p-cms': 'app/packages/cms',
		'p-customer': 'app/packages/customer',
		'p-dashboard': 'app/packages/dashboard',
		'p-delivery': 'app/packages/delivery',
		'p-exchange': 'app/packages/exchange',
		'p-inventory': 'app/packages/inventory',
		'p-orders': 'app/packages/orders',
		'p-payment': 'app/packages/payment',
		'p-system': 'app/packages/system',
		'p-theme': 'app/packages/theme',
	},
	static: {
		c: 'client'
	}
};
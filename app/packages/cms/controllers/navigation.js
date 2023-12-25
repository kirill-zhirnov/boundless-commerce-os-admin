import BasicController from '../../../modules/controller/basic';

export default class NavigationController extends BasicController {
	async actionMenu() {
		const menu = this.getParam('menu');
		const view = this.getView();
		const cache = this.getInstanceRegistry().getCache();

		if (!menu || !(menu in view.getMenu())) {
			throw new Error(`Menu not found '${menu}'!`);
		}

		//@ts-ignore
		const json = await cache.load(this.getModel('menuItem').getCacheKey(menu), async () => {
			const dataProvider = await this.createDataProvider('@p-cms/dataProvider/admin/menuItem', {}, {
				item: menu
			});

			//@ts-ignore
			const collection = await dataProvider.getTreeCollection();
			return collection.toJSON();
		});

		return this.json(json);
	}
}
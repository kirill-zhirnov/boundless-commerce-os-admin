const pathAlias = require('path-alias');
const BasicAdmin = pathAlias('@basicAdmin');

class TreeController extends BasicAdmin {
	async actionJsTreeLinks() {
		let dataProvider = await this.createDataProvider('@p-cms/dataProvider/admin/page/jsTreeLinks');

		this.json(
			await dataProvider.getJsTree()
		);
	}
}

module.exports = TreeController;
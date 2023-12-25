// const ymlFile = require('../../exchange/components/ymlFile');
// const domain = require('domain');
// const _ = require('underscore');
// const env = require('../../../modules/env');
// const SphinxProductIndexer = require('../modules/sphinx/productIndexer');

module.exports.trigger = async function(instanceRegistry, essence, idList = [], action = 'change') {
	if (!Array.isArray(idList))
		idList = [idList];

	switch (essence) {
		// case 'product':
		// 	return this.onProductChanged(instanceRegistry, idList, action);

		case 'category':
			return this.onCategoryChanged(instanceRegistry, idList, action);

		case 'manufacturer':
			return this.onManufacturerChanged(instanceRegistry, idList, action);

		// case 'commodityGroup':
		// 	return this.onCommodityGroupChanged(instanceRegistry, idList, action);

		// case 'settings':
		// 	return this.onSettingsChanged(instanceRegistry, idList, action);

		// case 'basketItem':
		// 	return this.onBasketItemChanged(instanceRegistry, idList, action);
	}
};

// module.exports.onBasketItemChanged = async function(instanceRegistry, idList, action) {
	// if (!domain.active || !Array.isArray(domain.active.members)) {
	// 	return Q();
	// }
	//
	// let req = null;
	// for (let member of Array.from(domain.active.members)) {
	// 	if (!member || !_.isObject(member)) {
	// 		continue;
	// 	}
	//
	// 	if ('constructor' in member && member.constructor && _.isObject(member.constructor) && (member.constructor.name === 'IncomingMessage')) {
	// 		req = member;
	// 		break;
	// 	}
	// }
	//
	// if (req && req.session && _.isObject(req.session) && ('checkout' in req.session)) {
	// 	req.session.checkout.shipping = null;
	// }
	//
	// return Q();
// };

// module.exports.onSettingsChanged = async function(instanceRegistry, idList, action) {
	// let clearYmlCache = false;
	//
	// if (action === 'change') {
	// 	for (let pk of Array.from(idList)) {
	// 		if (['system.company', 'exchange.yml'].indexOf(pk) !== -1) {
	// 			clearYmlCache = true;
	// 		}
	// 	}
	// }

	// if (clearYmlCache) {
	// 	await ymlFile.clearCache(instanceRegistry);
	// }
// };

// Possible action: change, bulkRm, bulkRestore
// module.exports.onCommodityGroupChanged = async function(instanceRegistry, idList, action) {
	// const db = instanceRegistry.getDb();
	//
	// if (action === 'change') {
	// 	for (let pk of Array.from(idList)) {
	// 		await db.model('commodityGroup').sphinxReIndexAll(pk);
	// 	}
	// }
// };

// Possible action: change, bulkRm, bulkRestore
module.exports.onManufacturerChanged = async function(instanceRegistry, idList, action) {
	const db = instanceRegistry.getDb();

	if (action === 'change') {
		// for (let pk of Array.from(idList)) {
			// await db.model('manufacturer').sphinxReIndex(pk, true);
		// }
	}

	await instanceRegistry.getCache().remove(db.model('manufacturer').getCacheKey());
};


// Possible action: change, bulkRm, bulkRestore, sorted, changeMenuVisibility
module.exports.onCategoryChanged = async function(instanceRegistry, idList, action) {
	const db = instanceRegistry.getDb();
	const cache = instanceRegistry.getCache();

	if (action === 'change') {
		for (let pk of Array.from(idList)) {
			// await db.model('category').sphinxReIndex(pk, true);
			await db.model('menuItem').clearCacheByCategory(instanceRegistry, pk);
		}
	}

	if (['change', 'sorted', 'changeMenuVisibility'].indexOf(action) !== -1) {
		await cache.remove(db.model('menuItem').getCacheKey('category'));
	} else if (['bulkRm', 'bulkRestore'].indexOf(action) !== -1) {
		await db.model('menuItem').clearAllMenuCaches(instanceRegistry);
	}

	if (['change', 'bulkRm', 'bulkRestore'].indexOf(action) !== -1) {
		// await ymlFile.clearCache(instanceRegistry);
	}
};

// Possible action: change, bulkRm, bulkRestore, changeQty
// Action changeQty will be called only if trackInventory for product is true
// module.exports.onProductChanged = async function(instanceRegistry, idList, action) {
	/*
	const db = instanceRegistry.getDb();

	const preparedEnv = await this.makeEnv(instanceRegistry);
	if (action === 'change') {
		for (const pk of idList) {
			// const indexer = new SphinxProductIndexer(preparedEnv);
			// await indexer.reIndexProduct(pk);

			// await db.model('menuItem').clearCacheByProduct(instanceRegistry, pk);
		}
	} else if (['bulkRm', 'bulkRestore'].includes(action)) {
		// await db.model('menuItem').clearAllMenuCaches(instanceRegistry);
	}

	await ymlFile.clearCache(instanceRegistry);
	 */
// };

// module.exports.makeEnv = instanceRegistry => env.create(instanceRegistry).getEnv();
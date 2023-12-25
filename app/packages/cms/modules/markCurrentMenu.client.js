const _ = require('underscore');
const utils = require('../../../modules/utils/common.client');

module.exports.process = function(menu, currentMenuUrl) {
	let out = [],
		hasActive = false
	;

	if (!Array.isArray(menu)) {
		menu = [];
	}

	menu.forEach((row) => {
		let item = _.omit(row, ['nodes']),
			children = {}
		;

		item.isActive = false;

		if (row.nodes) {
			children = this.process(row.nodes, currentMenuUrl);
			item.nodes = children.menu
		}

		if ((item.url && utils.isCurrentMenu(currentMenuUrl, item.url)) || (row.nodes && children.hasActive)) {
			item.isActive = true;
			hasActive = true;
		}

		out.push(item);
	});

	return {
		menu: out,
		hasActive: hasActive
	};
};

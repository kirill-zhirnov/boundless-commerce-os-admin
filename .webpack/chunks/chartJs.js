const pathAlias = require('path-alias');

let filesList = [
	'node_modules/chart.js/dist/chart.esm',
	'node_modules/chart.js/dist/chunks/helpers.segment',
	'node_modules/chartjs-adapter-date-fns/dist/chartjs-adapter-date-fns',
];

filesList = filesList.map((filePath) => {
	return pathAlias.resolve(filePath);
});

module.exports = filesList;
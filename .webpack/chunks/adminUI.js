const pathAlias = require('path-alias');

let filesList = [
	'node_modules/jstree/dist/jstree',
];

[
	'codeMirror',
].forEach((fileName) => {
	filesList = filesList.concat(require(`./adminUI/${fileName}`));
});


filesList = filesList.map((filePath) => {
	return pathAlias.resolve(filePath);
});

module.exports = filesList;
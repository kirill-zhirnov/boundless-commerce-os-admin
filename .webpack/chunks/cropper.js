const pathAlias = require('path-alias');

let filesList = [
	'node_modules/cropperjs/dist/cropper',
	'@p-theme/vue/image/ResizeModal'
];

filesList = filesList.map((filePath) => {
	return pathAlias.resolve(filePath);
});

module.exports = filesList;
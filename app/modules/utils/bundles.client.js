// @ts-nocheck

let bundles = {};

module.exports.load = function(name) {
	return Promise.resolve()
		.then(() => {
			if (!(name in bundles)) {
				switch (name) {
					case 'admin':
						return import(/* webpackChunkName: "admin" */ '../../client-entry/admin');

					case 'adminUI':
						return import(/* webpackChunkName: "adminUI" */ '../../client-entry/adminUI');

					case 'clientUI':
						return import(/* webpackChunkName: "clientUI" */ '../../client-entry/clientUI');

					case 'cropper':
						return import(/* webpackChunkName: "cropper" */ '../../client-entry/cropper');

					case 'i18n':
						return import(/* webpackChunkName: "i18n" */ '../../client-entry/i18n');

					case 'chartJs':
						return import(/* webpackChunkName: "chartJs" */ '../../client-entry/chartJs');

					// case 'themes/neptune':
					// 	return import(/* webpack_ChunkName: "themes/neptune" */ 'themes/neptune/js/neptune');

					default:
						throw new Error(`Unknown bundle ${name}`);
				}
			}
		})
		.then((module) => {
			if (module)
				bundles[name] = module;

			return bundles[name] = module;
		});
};

module.exports.all = function(bundles) {
	let promises = [];
	bundles.forEach((bundle) => {
		promises.push(this.load(bundle));
	});

	return Promise.all(promises);
};
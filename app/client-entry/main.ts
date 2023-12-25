import 'core-js/stable';
import 'regenerator-runtime/runtime';

import pathAlias from 'path-alias';
// [^/]+
const widgetsRequire = require.context('../', true, /(auth|dashboard|system|orders|cms|catalog|customer|inventory|payment)\/widgets\/[^/]+\.client\.(js|ts)$/i);

pathAlias.setRequireCallback((filePath, resolved) => {
	resolved = resolved.replace(/^app\//, './');

	// if (/\/vue\/.+\.client$/i.test(resolved)) {
	// 	return vueRequire(`${resolved}.js`);
	// }
	//
	// if (/\/bosses\/.+\.client$/i.test(resolved)) {
	// 	resolved = appendExtension(bossesRequire.keys(), resolved);
	// 	return bossesRequire(resolved);
	// }
	//
	if (!/\.(js|ts)$/i.test(resolved)) {
		resolved = appendExtension(widgetsRequire.keys(), resolved);
	}

	return widgetsRequire(resolved);
});

import $ from 'jquery';
import jadeRuntime from 'jade/runtime';
import '../views/less/basic.less';
import '../views/scss/styles.scss';
import {bootstrapClient} from '../modules/bootstrap/client/bootstrap.client';

//@ts-ignore
window.$ = $;
//@ts-ignore
window.jQuery = $;
//@ts-ignore
window.jade = jadeRuntime;

(async () => await bootstrapClient())();

const appendExtension = function(filesList, filePath) {
	let foundExt = null;
	const found = filesList.find((item) => {
		if (`${filePath}.js` == item) {
			foundExt = 'js';
			return true;
		}

		if (`${filePath}.ts` == item) {
			foundExt = 'ts';
			return true;
		}
	});

	if (found)
		filePath += `.${foundExt}`;

	return filePath;
};
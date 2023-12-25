import pathAlias from 'path-alias';
import BasicRenderer from './basic';
import {wrapperRegistry} from '../../registry/server/classes/wrapper';
import JadeDecorator from '../../jade/decorator/server';
import _ from 'underscore';

export default class RequestView extends BasicRenderer {
	constructor(frontController, config = {}, theme = null) {
		super(config);

		this.frontController = frontController;

		this.setTheme(theme);
		this.instanceRegistry = this.frontController.getInstanceRegistry();

		this.setCache(this.instanceRegistry.getCache());

		this.pathAliases = RequestView.createPathAliases(this.instanceRegistry, this.theme);
		this.allowedPaths = RequestView.createAllowedPaths(this.instanceRegistry, this.theme);
	}

	setupJadeDecorator(data) {
		const decorator = new JadeDecorator(data);
		decorator.setFrontController(this.frontController);

		return decorator;
	}

	async preloadClientBundle(bundle) {
		let tpls = require(this.resolveBundlePath(bundle));

		// if (this.theme) {
		// 	tpls = tpls.concat(this.theme.getPreloadedClientBundle(bundle));
		// }

		for (const tpl of tpls) {
			const result = await this.localCompileClient(tpl.type, tpl.file, {}, tpl.packageName);
			tpl.tpl = result;
		}

		return tpls;
	}

	resolveBundlePath(bundle) {
		bundle = bundle.replace(/[\.\/]/g, '');

		return `${pathAlias.resolve('@modules/viewRenderer/preload')}/${bundle}.js`;
	}

	getClientExport() {
		return {
			config: wrapperRegistry.getView().getClientConfig(),
			globalViewData: this.globalViewData
		};
	}

	static createAllowedPaths(instanceRegistry, theme = null) {
		const out = [
			// pathAlias.resolve('app/views'),
			instanceRegistry.getInstancePath()
		];

		if (theme) {
			out.push(theme.getPath());
		}

		return out;
	}

	static createPathAliases(instanceRegistry, theme = null) {
		return {
			'$pages' : `${instanceRegistry.getInstancePath()}/home/pages`,
			'$landings' : `${instanceRegistry.getInstancePath()}/home/landings`,
			'$theme' : theme ? `${theme.getPath()}/templates` : null,
			'$userViews' : theme ? `${theme.getConfig('userFilesPath')}/views` : null
		};
	}

	getFrontController() {
		return this.frontController;
	}

	destroy() {
		this.frontController = null;
		this.instanceRegistry = null;
		this.cache = null;
	}
}

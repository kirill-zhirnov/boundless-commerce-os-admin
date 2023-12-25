import Widget from '../../../modules/widget/widget.client';
import {wrapperRegistry} from '../../../modules/registry/server/classes/wrapper';
import utils from '../../../modules/utils/common.client';
import ServerClientRegistry from '../../../modules/registry/client/server';
import pathAlias from 'path-alias';
import {promisify} from 'util';
import uglifyJS from 'uglify-js';
import fs from 'fs';
import parseISO from 'date-fns/parseISO';
import getUnixTime from 'date-fns/getUnixTime';

const readFile = promisify(fs.readFile);

export default class ClientLoader extends Widget {
	constructor(options) {
		super(options);

		this.clientExport = false;
	}

	async run() {
		const clientRegistry = this.getClientRegistry();
		const instanceRegistry = this.getInstanceRegistry();

		//@ts-ignore
		const user = clientRegistry.getUser();

//		skip keys, which are not necessary
// 		const pathAliases = _.omit(pathAlias.exportAliasesForClientSide(), [
// 			'basicController', 'bb-resource', 'grid-resource'
// 		]);

		let exportStr = {
			// pathAliases,
			//@ts-ignore
			registry: await this.getClientRegistry().export(instanceRegistry),
			//@ts-ignore
			bundles: this.getClientRegistry().getBundles(),
			routes: instanceRegistry.getRouter().exportToClient(),
			//@ts-ignore
			viewRenderer: this.getView().getClientExport(),
			page: {
				aos: this.data?.page?.aos || false
			},
			metaActions: {
				events: this.data?.ajaxMeta?.events || []
			},
			user: {
				roles: user.getRoles(),
				isAdmin: user.isAdmin(),
				email: user.getState('profile') && user.getState('profile').email
			}
		};

		let clientLoader = await this.getClientLoader();
		clientLoader = clientLoader.replace('{SCRIPT_SRC}', utils.getGlobalStaticUrl('/js/main.bundle.js'));

		// const themeExport = null;
		// this.getView().getTheme().getClientExport(),
		const headerInjection = await instanceRegistry.getSettings().get('cms', 'headerInjection');

		// exportStr.registry.config.theme = themeExport;

		//@ts-ignore
		if (clientRegistry.getUser().isAdmin()) {
			const instanceInfo = instanceRegistry.getInstanceInfo();

			Object.assign(exportStr, {
				instance: {
					instance_id: instanceInfo.instance_id,
					//@ts-ignore
					created: getUnixTime(parseISO(instanceInfo.available_since)),
					is_demo: instanceInfo.is_demo
				}
			});
		}

		return this.render('clientLoader', {
			exportStr,
			clientLoader,
			headerInjection
		}, false);
	}

	async getClientLoader() {
		return await wrapperRegistry.getGeneralCache().load('clientLoaderSource', async () => {
			const jsContent = await readFile(pathAlias.resolve('@modules/bootstrap/client/loader.js'), {encoding : 'utf-8'});
			const {code} = uglifyJS.minify(jsContent);

			return code;
		});
	}
}
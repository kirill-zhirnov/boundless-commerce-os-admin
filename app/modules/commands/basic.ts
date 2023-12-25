import BasicRenderer from '../viewRenderer/renderer/basic';
import {wrapperRegistry} from '../registry/server/classes/wrapper';

export default class BasicCommand {
	private readonly cwd: string;

	constructor(protected readonly options : {[k: string]: unknown}) {
		this.options = options;
		this.cwd = process.cwd();
	}

	getOption(name: string, defaultVal = null): string | null {
		if (name in this.options) {
			return this.options[name] as unknown as string;
		}

		return defaultVal;
	}

	getCwd() {
		return this.cwd;
	}

	createView() {
		const viewConfig = wrapperRegistry.getConfig().viewRenderer.instanceView;

		const view = new BasicRenderer(viewConfig);
		view.setCache(wrapperRegistry.getGeneralCache());

		return view;
	}
}
import utils from '../utils/common.client';

// store active widget
let active = null;

export function create(options = {}, widgetConstructor = 'system.bulkButtons.@c') {
	this.remove();

	const [packageName, fileName] = utils.extractComponentName(widgetConstructor);
	const WidgetConstructor = utils.requireFile(`@p-${packageName}/widgets/${fileName}`).default;
	options.packageName = packageName;

	active = new WidgetConstructor(options);
	//@ts-ignore
	active.render();

	return active;
}

export function remove() {
	if (active) {
		active.remove();
		return active = null;
	}
}

export const getActive = () => active;
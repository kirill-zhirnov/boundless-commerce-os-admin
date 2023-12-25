import {clientRegistry} from '../registry/client/client.client';

export function initWidget(widgetId) {
	if (!clientRegistry.getWidgets().has(widgetId)) {
		throw new Error(`Widget with id '${widgetId}' is not in registry!`);
	}

	clientRegistry.getWidgets().get(widgetId).onElReady();
}
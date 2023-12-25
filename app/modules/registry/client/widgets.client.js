import Registry from '../basic.client';

export default class WidgetsRegistry extends Registry {
	verifyExistence() {
		const out = [];
		for (let key in this.variables) {
			const widget = this.variables[key];
			out.push(widget.verifyExistence());
		}

		return out;
	}
}

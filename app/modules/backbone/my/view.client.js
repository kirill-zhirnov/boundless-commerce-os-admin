import Backbone from 'backbone';

if (!('My' in Backbone)) {
	//@ts-ignore
	Backbone.My = {};
}

export default class MyBackboneView extends Backbone.View {
	constructor(options) {
		super(options);

		this._listeningTo$ = [];
		this.crOnCLientSide = null;
	}

	listenTo$(obj, name, selector, handler) {
		if (arguments.length === 3) {
			handler = selector;
			selector = null;
		}

		if (!(obj instanceof Backbone.$)) {
			obj = Backbone.$(obj);
		}

		handler = Backbone.$.proxy(handler, this);
		name = `${name}.${this.getEventsSuffix()}`;

		this._listeningTo$.push(obj);
		obj.on(name, selector, handler);

		return this;
	}

	stopListening$() {
		return Array.from(this._listeningTo$).map((obj) =>
			obj.off(`.${this.getEventsSuffix()}`));
	}

	isInDom() {
		return Backbone.$.contains(document.body, this.el);
	}

	remove() {
		const isInDom = this.isInDom();

//		fixme: with product form and widgets inside dynamice tabs, sometimes we have a bug:
//		TypeError: this.$el is null. I redefined method, since we need to run sales ASAP, but it is not healthy. Fix it.
		if (this.$el !== null) {
			this.$el.remove();
		}

		//@ts-ignore
		this.stopListening();

		this.stopListening$();

		this.el = null;
		this.$el = null;
		this.collection = null;
		this.model = null;

		const clientRegistry = this.getCROnClientSide();
		if (isInDom && clientRegistry) {
			clientRegistry.getWidgets().verifyExistence();
		}

		return this;
	}

	getEventsSuffix() {
		//@ts-ignore
		return `myViewEvents${this.cid}`;
	}

	getCROnClientSide() {
		if (!this.crOnCLientSide) {
			this.crOnCLientSide = require('../../registry/client/client.client').clientRegistry;
		}

		return this.crOnCLientSide;
	}
}

//@ts-ignore
Backbone.My.View = MyBackboneView;

import $ from 'jquery';
let uuid = 0;

export default {
	install: (Vue, options) => {
		Vue.mixin({
			beforeCreate() {
				this.listeningTo$ = [];

				this.uuid = uuid.toString();
				uuid += 1;
			},

			beforeDestroy() {
				this.stopListening$();
			},

			methods: {
				listenTo$(...args) {
					let obj, eventName, selector, handler;

					if (args.length == 4) {
						[obj, eventName, selector, handler] = args;
					} else if (args.length == 3) {
						[obj, eventName, handler] = args;
					}

					eventName = `${eventName}${this.eventsSuffix()}`;

					if (!(obj instanceof $)) {
						obj = $(obj);
					}

					this.listeningTo$.push(obj);
					//@ts-ignore
					obj.on(eventName, selector, handler);
				},

				stopListening$() {
					this.listeningTo$.forEach((obj) => obj.off(this.eventsSuffix()));
					this.listeningTo$ = [];
				},

				eventsSuffix() {
					return `.vueEvent${this.uuid}`;
				}
			}
		});
	}
};
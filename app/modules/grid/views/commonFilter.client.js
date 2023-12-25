// @ts-nocheck
import _ from 'underscore';
import Filter from '../../../packages/system/widgets/filter.client';

export default class CommonFilter extends Filter {
	constructor(options) {
		super(options);

		this.formKeys = null;
		this.listenTo(this.collection, 'backgrid:beforeHeaderFilterRefresh', function() {
			return this.appendQueryParams();
		});
	}

	fetch() {
		this.appendQueryParams();
		return this.collection.getFirstPage({
			reset: true,
			fetch: true
		});
	}

	appendQueryParams() {
		if (this.formKeys != null) {
			for (let key of Array.from(this.formKeys)) {
				this.collection.queryParams[key] = null;
			}
		}

		const serializedObj = this.$el.serializeObject();
		this.formKeys = _.keys(serializedObj);

		return _.extend(this.collection.queryParams, serializedObj);
	}
}
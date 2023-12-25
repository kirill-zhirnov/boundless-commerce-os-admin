import BulkButtons from '../../../../packages/system/widgets/bulkButtons.client';

export default class CommonButtons extends BulkButtons {
	render() {
		const iterable = this.resolveButtons();
		for (let i = 0; i < iterable.length; i++) {
			const button = iterable[i];
			this.$el.append(this.createButton(button));
		}

		return this;
	}
}
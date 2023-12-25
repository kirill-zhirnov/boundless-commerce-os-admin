import ChangeQtyGrid from '../../inventory/widgets/changeQtyGrid.client';
import gHtml from '../../../modules/gHtml/index.client';

export default class ProductQtyHistoryGrid extends ChangeQtyGrid {
	initGrid() {
		super.initGrid();

		this.collection = this.url('catalog/admin/productQtyHistory/collection');

		const newColumns = [];
		for (let i = 0; i < this.columns.length; i++) {
			const column = this.columns[i];
			if (column.name === 'item') {
				if (this.data.product.variants > 0) {
					newColumns.push(this.getItemColumn());
				}
			} else {
				column.clickable = false;
				newColumns.push(column);
			}
		}

		return this.columns = newColumns;
	}

	getItemColumn() {
		return {
			name: 'item',
			label: this.__('Item'),
			cell: 'html',
			clickable: false,
			html: (column, model) => {
				let title, type;
				if (model.get('type') === 'product') {
					type = this.__('Product');
					title = model.get('title');
				} else {
					type = this.__('Variant');
					title = model.get('variant_title');
				}

				let out = gHtml.tag('p', {class: 'small'}, title);
				out += gHtml.tag('p', {class: 'small text-muted'}, `${this.__('Type')}: ${type}`);

				if (model.get('sku')) {
					out += gHtml.tag('p', {class: 'small text-muted'}, `${this.__('SKU')}: ${model.get('sku')}`);
				}

				return out;
			}
		};
	}

	getFileName() {
		return __filename;
	}
}
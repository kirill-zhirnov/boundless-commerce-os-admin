import ProductSizeForm from '../size';

export default class VariantSizeForm extends ProductSizeForm {
	setupAttrsByRecord() {
		//@ts-ignore
		this.setAttrsByField(this.record.size);
	}

	save() {
		//@ts-ignore
		this.record.size = this.getSizeForSave();
		return this.record.save();
	}
}
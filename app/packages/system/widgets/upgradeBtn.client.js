import Widget from '../../../modules/widget/widget.client';

// Mock for the Open-Source version
export default class UpgradeBtn extends Widget {

	run() {
		return this.resolveEmpty();
	}

	getFileName() {
		return __filename;
	}
}
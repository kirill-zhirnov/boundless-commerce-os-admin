let Dropzone, i18n, theme;
import _ from 'underscore';

if (!process.env.__IS_SERVER__) {
	Dropzone = require('dropzone').default;

	const clientRegistry = require('../../../modules/registry/client/client.client').clientRegistry;
	i18n = clientRegistry.getI18n();
	theme = clientRegistry.getTheme();
}

export default class DropzoneWrapper {
	constructor(container, url, options) {
		this.defaultOnError = this.defaultOnError.bind(this);
		this.defaultOnSuccess = this.defaultOnSuccess.bind(this);

		this.options = _.extend({
			url,
			maxFiles : 1,
			parallelUploads : 1,
			acceptedFiles : 'image/*',
			onError : this.defaultOnError,
			onErrorHook : null,
			errorMessage : i18n.__('Error'),
			onSuccess : this.defaultOnSuccess,
			onSuccessHook : null,
			successMessage : i18n.__('File was successfully uploaded'),
			dictDefaultMessage : i18n.__('Drop image file here to upload or click to select.'),
			processing : () => {
				if (!this.inProgress) {
					theme.showAjaxLoading();
					return this.inProgress = true;
				}
			},

			onQueueCompleteHook: null,
			queuecomplete : () => {
				if (this.inProgress) {
					theme.hideAjaxLoading();
					this.inProgress = false;
				}

				if (_.isFunction(this.options.onQueueCompleteHook)) {
					return this.options.onQueueCompleteHook();
				}
			}

		}, options);

		this.dropZone = new Dropzone(container, this.options);
		this.dropZone.on('error', this.options.onError);
		this.dropZone.on('success', this.options.onSuccess);

		this.inProgress = false;
	}

	defaultOnError(file, dropZoneError, xhr) {
		this.dropZone.removeFile(file);

		const error = this.parseError(file, dropZoneError, xhr);
		theme.alertDanger(error);

		if (_.isFunction(this.options.onErrorHook)) {
			this.options.onErrorHook(file, dropZoneError, xhr);
		}

	}

	defaultOnSuccess(file, response) {
		this.dropZone.removeFile(file);

		if (this.options.successMessage && this.checkUploadedData(response)) {
			theme.alertSuccess(this.options.successMessage);
		}

		if (_.isFunction(this.options.onSuccessHook)) {
			this.options.onSuccessHook(file, response);
		}

	}

	getDropzone() {
		return this.dropZone;
	}

	checkUploadedData(response) {
		const {
            uploadedData
        } = response.d;
		let out = false;

		if (uploadedData != null) {
			if (!_.isArray(uploadedData) || (uploadedData[0] != null)) {
				out = true;
			}
		}

		return out;
	}

	parseError(file, dropZoneError, xhr) {
		let error;
		if (xhr != null) {
			try {
				const response = JSON.parse(xhr.responseText);

				if (_.isObject(response) && response.d?.errors?.file?.[0]) {
					error = response.d.errors.file[0];
				}

			} catch (e) {
				error = this.options.errorMessage;
			}

		} else if (dropZoneError != null) {
			error = i18n.__(dropZoneError);
		}

		return error;
	}

	remove() {
		if (this.dropZone) {
			for (let event of ['success', 'error']) {
				this.dropZone.off(event);
			}

			this.dropZone.destroy();
		}

	}
}
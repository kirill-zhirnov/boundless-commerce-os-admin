import Component from '../../../../modules/component';
import * as mustacheCompiler from '../../../system/modules/mustacheCompiler';
import stripTags from 'striptags';
import validator from '../../../../modules/validator/validator';

export default class BasicSeoTpls extends Component {
	constructor(env) {
		super(env);

		this.templates = null;
	}

	compile(template, data, runInVm = false) {
		if (runInVm) {
			return mustacheCompiler.vmCompile(template, data);
		} else {
			return mustacheCompiler.compile(template, data);
		}
	}

	getTplFunctions() {
		return {
			// ucfirst: function() {
			// 	return function (str, render) {
			// 		str = String(str);
			// 		str = str.charAt(0).toUpperCase() + str.slice(1);
			//
			// 		return render(str);
			// 	}
			// },
			//
			// lcfirst: function() {
			// 	return function (str, render) {
			// 		str = String(str);
			// 		str = str.charAt(0).toLowerCase() + str.slice(1);
			// 		console.log('-------- lowered!', str)
			// 		return render(str);
			// 	}
			// }
		};
	}

	prepareHtmlText(value) {
		return validator.trim(stripTags(value));
	}

	cutShortHtmlText(textValue, maxLength = 100) {
		textValue = String(textValue);

		if (textValue.length > maxLength) {
			textValue = `${textValue.substr(0, maxLength)}...`;
		}

		return textValue;
	}
}
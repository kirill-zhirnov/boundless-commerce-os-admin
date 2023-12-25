import Mustache from 'mustache';
import {VM} from 'vm2';

export function vmCompile(template: string, data: ITemplateData) {
	const vm = new VM({
		timeout: 100,
		sandbox: {
			Mustache,
			template,
			data
		}
	});

	return vm.run('Mustache.render(template, data)');
}

export function compile(template: string, data: ITemplateData) {
	return Mustache.render(template, data);
}

export interface ITemplateData {
	[key: string]: string | number;
}
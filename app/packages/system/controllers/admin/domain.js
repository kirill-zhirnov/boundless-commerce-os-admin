import BasicAdmin from '../admin';
import _ from 'underscore';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';
import help from '../../../../modules/help';

export default class DomainController extends BasicAdmin {
	async actionIndex() {
		if (this.getInstanceRegistry().getInstanceInfo().is_demo) {
			this.redirect(['system/admin/domain/demo']);
			return;
		}

		const formKit = this.createFormKit('@p-system/forms/domain', {}, {
			successMsg: false,
			beforeJson: () => {
				this.metaModal(this.url('system/admin/domain/setupHelp'));
			}
		});

		if (this.isSubmitted()) {
			await formKit.process();
		} else {
			const data = await formKit.getWebForm();

			this.setPage('title', this.__('Domain settings'));

			//@ts-ignore
			data.help = help.get('domainSetup');

			//@ts-ignore
			_.extend(data.buttons, {
				buttons: ['save'],
				predefinedButtons: {
					save: {
						title: this.__('Save'),
						class: 'btn btn-primary save hidden'
					}
				}
			});

			// @render 'form', data
			this.widget('system.domainWidget.@c', {data});
		}
	}

	actionSetupHelp() {
		this.modal('setupHelp', {
			//@ts-ignore
			ipAddress: wrapperRegistry.getConfig().ARecordIp
		}, 'Настройка домена');
	}

	async actionReset() {
		const formKit = this.createFormKit('@p-system/forms/domain', {}, {
			data: {
				domain: this.getEditingSite().system_host
			},

			//@ts-ignore
			success: () => {
				const protocol = wrapperRegistry.getConfig().instanceManager.useHttps ? 'https' : 'http';
				this.metaLocationRedirect(`${protocol}://${this.getEditingSite().system_host}/system/admin/domain/index`);

				return setTimeout(() => {
					return this.json(true);
				}
					, 500);
			}
		});

		await formKit.process();
	}

	actionDemo() {
		if (!this.getInstanceRegistry().getInstanceInfo().is_demo) {
			this.redirect(['system/admin/domain/index']);
			return;
		}

		this.getResponse().setLayoutData('currentMenuUrl', this.url('system/admin/domain/index'));

		this.setPage('title', this.__('Domain settings'));
		this.render('demo');
	}
}
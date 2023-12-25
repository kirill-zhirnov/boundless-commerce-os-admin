import Form, {ITplData} from '../../../../modules/form/index';
import {IPersonModel, IPersonModelStatic} from '../../models/person';
import {TPublishingStatus} from '../../../../@types/db';
import {IPerson} from '../../../../@types/person';
import {IRoleModelStatic} from '../../../auth/models/role';
import {IPersonProfileModelStatic} from '../../models/personProfile';
import * as eventNotification from '../../../../modules/notifier/eventNotification';
import {TQueueEventType} from '../../../../@types/rabbitMq';
import randomString from 'random-string';
import {IPersonAuthModelStatic} from '../../models/personAuth';
import CustomerRegisterMails from '../../mails/registerMails';
import {Op} from 'sequelize';

export interface ICustomerFormAttrs {
	first_name: string | null;
	last_name: string | null;
	email: string | null;
	phone: string | null;
	receive_marketing_info: string | null | boolean;
	send_welcome_email: string | null;
	comment: string | null;
}

export default class CustomerForm extends Form<ICustomerFormAttrs, IPersonModel> {
	getRules() {
		return [
			['first_name', 'required'],
			['email', 'email'],
			['email', 'validateEmail'],
			// ['email', 'isUnique', {
			// 	field: 'email',
			// 	row: this.record,
			// 	model: this.getModel('person')
			// }],
			['last_name, comment, receive_marketing_info, send_welcome_email', 'safe'],
			['phone', 'isPhoneNumber'],
		];
	}

	async setupAttrs() {
		await super.setupAttrs();

		if (this.record) {
			const personProfile = this.record.personProfile!;
			Object.assign(this.attributes, {
				first_name: personProfile.first_name,
				last_name: personProfile.last_name,
				phone: personProfile.phone,
				comment: personProfile.comment,
				receive_marketing_info: personProfile.receive_marketing_info ? '1' : null
			});

			this.scenario = (this.record.status === TPublishingStatus.draft) ? 'insert' : 'update';
		}
	}

	async loadRecord(): Promise<IPersonModel> {
		return await (this.getModel('person') as IPersonModelStatic).findException({
			include: [
				{model: this.getModel('personProfile')}
			],
			where: {
				person_id: this.pk
			}
		}) as IPersonModel;
	}

	async save() {
		if (!this.record) {
			throw new Error('Form works with drafts only');
		}

		const attrs = this.getSafeAttrs();
		const wasDraft = this.record.status == TPublishingStatus.draft;

		if (wasDraft) {
			this.record.set({
				status: TPublishingStatus.published
			});
		}

		const shallSendWelcomeEmail = attrs.send_welcome_email == '1';
		const shallRegisterCustomer = (wasDraft && shallSendWelcomeEmail) || (!this.record.registered_at && shallSendWelcomeEmail);

		if (shallRegisterCustomer) {
			this.record.set({
				//@ts-ignore
				registered_at: this.getDb().fn('now')
			});
		}

		await this.record.set({
			email: attrs.email
		}).save();

		await (this.getModel('personProfile') as IPersonProfileModelStatic).update({
			first_name: attrs.first_name,
			last_name: attrs.last_name,
			phone: attrs.phone,
			receive_marketing_info: attrs.receive_marketing_info == '1' ? true : false,
			comment: attrs.comment
		}, {
			where: {
				person_id: this.record.person_id
			}
		});

		const RoleModel = this.getModel('role') as IRoleModelStatic;
		if (shallRegisterCustomer) {
			await RoleModel.setClientRoles(this.record.person_id);
		} else if (wasDraft) {
			await RoleModel.setGuestBuyerRoles(this.record.person_id);
		}
		//только если регается, если гость то нужна роль гостя!
		// await (this.getModel('role') as IRoleModelStatic).addClientRoles(this.record.person_id);

		if (shallSendWelcomeEmail) {
			const pass = randomString({
				length: 5,
				letters: true,
				numeric: true,
				special: false
			});

			await (this.getModel('personAuth') as IPersonAuthModelStatic).updatePass(this.record.person_id, pass);

			const customerMail = new CustomerRegisterMails(this.getInstanceRegistry());
			await customerMail.sendWelcomeEmail(attrs.email, pass, attrs.first_name);
		}

		await eventNotification.notifyCustomerEvent(
			this.getInstanceRegistry(),
			this.getUser().getId(),
			wasDraft ? TQueueEventType.created : TQueueEventType.updated,
			this.record.person_id
		);
	}

	async getTplData() {
		const data: ITplData<ICustomerFormAttrs> & {person?: IPerson} = await super.getTplData();

		if (this.record) {
			data.person = this.record.toJSON() as IPerson;
		}

		return data;
	}

	async setupChildFormKit(childFormKit) {
		const form = await childFormKit.getForm();

		if (typeof (form.setPersonRecord) === 'function') {
			await form.setPersonRecord(this.record);
		}
	}

	async validateEmail(value: string) {
		const isDraft = !this.record || this.record.status == TPublishingStatus.draft;
		const sendWelcomeEmail = this.attributes.send_welcome_email == '1';

		//validate on uniquness only if registered customer
		if (this.record?.registered_at || sendWelcomeEmail) {
			const where = {
				email: value.toLowerCase(),
				registered_at: {
					[Op.ne]: null
				}
			};

			if (!isDraft) {
				Object.assign(where, {
					person_id: {
						[Op.ne]: this.record.person_id
					}
				});
			}

			const row = await this.getModel('person').findOne({where});

			if (row) {
				this.addError('email', 'notUnique', this.__('The email is already taken. Email should be unique across registered users.'));
				return;
			}
		}
	}
}
import BaseMailer from './base';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';
import {IInstance} from '../../../../@types/instances';
import FeedbackMails from '../../mails/feedbackMails';

const FEEDBACK_MAIL_ALIAS = 'feedbackRequest';
type TInstanceRow = IInstance & {wix_instance_id: string};

export default class FeedbackRequestMailer extends BaseMailer {
	async send() {
		const instances = await this.fetchInstancesToSend();
		for (const instance of instances) {
			const isWix = instance.wix_instance_id !== null;

			const feedbackMail = new FeedbackMails();
			await feedbackMail.sendRequestForFeedback(instance.client_email, isWix);

			await this.saveMailLog(instance.instance_id, FEEDBACK_MAIL_ALIAS, feedbackMail.getSender());
		}
	}

	async fetchInstancesToSend(): Promise<TInstanceRow[]> {
		const db = wrapperRegistry.getDb();
		const rows = await db.sql<TInstanceRow>(`
			select
				instance.*,
				wix_app.wix_instance_id
			from
				instance
				left join (
					select
						*
					from
						mail_log
					where
						mail_alias = :alias
				) log on log.instance_id = instance.instance_id
				left join wix_app on
					wix_app.instance_id = instance.instance_id
					and wix_app.status = 'ready'
			where
				available_since <= now() - interval '1 day'
				and log.mail_alias is null
				and instance.is_free = false
				and instance.instance_id > 103
		`, {
			alias: FEEDBACK_MAIL_ALIAS
		});

		return rows;
	}
}
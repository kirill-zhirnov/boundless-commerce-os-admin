import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

export default abstract class BaseMailer {
	async saveMailLog(instanceId: number, alias: string, sender: string) {
		const db = wrapperRegistry.getDb();
		await db.sql(`
			insert into mail_log
				(instance_id, mail_alias, sender)
			values
				(:instanceId, :alias, :sender)
		`, {
			instanceId, alias, sender
		});
	}
}
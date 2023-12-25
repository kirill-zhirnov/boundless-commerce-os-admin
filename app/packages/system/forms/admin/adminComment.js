import Form from '../../../../modules/form/index';

export default class AdminComment extends Form {
	getRules() {
		return [
			['essencePk,type,comment', 'required'],
			['essencePk', 'validateEssencePk']
		];
	}

	async save() {
		const attrs = this.getSafeAttrs();

		const [essence] = await this.getModel('essence').findOrCreate({
			where: {
				type: attrs.type,
				essence_local_id: attrs.essencePk
			},
			defaults: {
				type: attrs.type,
				essence_local_id: attrs.essencePk
			}
		});

		await this.getModel('adminComment').create({
			essence_id: essence.essence_id,
			person_id: this.getUser().getId(),
			comment: attrs.comment
		});
	}

	async validateEssencePk() {
		const res = await this.getModel('essence').isEssenceExists(this.attributes.type, this.attributes.essencePk);

		if (!res) {
			this.addError('comment', 'essenceNotExists', 'Commented essence does not exist!');
		}
	}
}
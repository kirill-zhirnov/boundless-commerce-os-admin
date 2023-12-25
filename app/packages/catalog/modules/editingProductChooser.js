export async function get(controller, personId, productId = null) {
	if (productId) {
		return {
			id: productId,
			scenario: 'update'
		};
	}

	const db = controller.getDb();
	const i18n = controller.getI18n();
	const lang = controller.getLang();

	const group = await db.model('commodityGroup').getDefaultCommodityGroup(lang.lang_id, i18n.__('Default Product Type'));
	const [row] = await db.sql(`
		insert into product
			(group_id, status, created_by)
		values
			(:groupId, 'draft', :created)
			on conflict (status, created_by)
			where status = 'draft' and created_by is not null
		do update set
			status = excluded.status
			returning product_id
	`, {
		groupId: group.group_id,
		created: personId
	});

	return {
		scenario: 'insert',
		id: row.product_id
	};
}
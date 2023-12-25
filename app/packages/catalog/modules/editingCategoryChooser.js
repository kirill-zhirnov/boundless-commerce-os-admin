module.exports.get = async function(state, personId, categoryId = null) {
	if (categoryId) {
		return {
			id: categoryId,
			scenario: 'update'
		};
	}

	const db = state.getDb();
	const clientRegistry = state.getClientRegistry();

	const [row] = await db.sql(`
		insert into category
			(site_id, status, created_by)
		values
			(:site, 'draft', :created)
		on conflict (status, created_by)
			where status = 'draft'and created_by is not null
		do update set
			status = excluded.status
		returning category_id
	`, {
		site: clientRegistry.getSite().site_id,
		created: personId
	});

	return {
		scenario: 'insert',
		id: row.category_id
	};
};
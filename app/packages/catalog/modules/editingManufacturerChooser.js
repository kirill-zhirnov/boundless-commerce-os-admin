export const get = async (controller, personId, manufacturerId = null) => {
	if (manufacturerId) {
		return {
			id: manufacturerId,
			scenario: 'update'
		};
	}

	const db = controller.getDb();

	const [row] = await db.sql(`
		insert into manufacturer
			(status, created_by)
		values
			('draft', :created)
		on conflict
			(status, created_by)
		where
			status = 'draft'
			and created_by is not null
		do update set
			status = excluded.status
		returning manufacturer_id
	`, {
		created: personId
	});

	return {
		scenario: 'insert',
		id: row.manufacturer_id
	};
};
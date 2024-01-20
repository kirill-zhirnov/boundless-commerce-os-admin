export default function (db) {
	// person - role - personRoleRel
	const Person = db.model('person');
	const PersonAuth = db.model('personAuth');
	const PersonToken = db.model('personToken');
	const Role = db.model('role');
	const PersonRoleRel = db.model('personRoleRel');
	const PersonProfile = db.model('personProfile');
	const Site = db.model('site');
	const Orders = db.model('orders');
	const PersonGroupRel = db.model('personGroupRel');

	PersonRoleRel.belongsTo(Person, {
		foreignKey: 'person_id'
	});
	PersonRoleRel.belongsTo(Role, {
		foreignKey: 'role_id'
	});
	Person.hasMany(PersonRoleRel, {
		foreignKey: 'person_id'
	});
	Person.belongsToMany(Role, {
		through: PersonRoleRel,
		foreignKey: 'person_id',
		otherKey: 'role_id'
	});
	Person.hasOne(PersonAuth, {
		foreignKey: 'person_id'
	});
	Person.hasOne(PersonProfile, {
		foreignKey: 'person_id'
	});
	Person.belongsTo(Site, {
		foreignKey: 'site_id'
	});
	Role.hasMany(PersonRoleRel, {
		foreignKey: 'role_id'
	});
	Role.belongsToMany(Person, {
		through: PersonRoleRel,
		foreignKey: 'role_id',
		otherKey: 'person_id'
	});

	PersonAuth.belongsTo(Person, {
		foreignKey: 'person_id'
	});

	Site.hasMany(Person, {
		foreignKey: 'person_id'
	});

	PersonToken.belongsTo(Person, {
		foreignKey: 'person_id'
	});
	Person.hasMany(PersonToken, {
		foreignKey: 'person_id'
	});
	Person.hasMany(PersonGroupRel, {
		foreignKey: 'person_id'
	});

	const PersonAddress = db.model('personAddress');
	const Country = db.model('country');
	const VwCountry = db.model('vwCountry');

	Person.hasMany(PersonAddress, {
		foreignKey: 'person_id'
	});
	PersonAddress.belongsTo(Person, {
		foreignKey: 'person_id'
	});
	PersonAddress.belongsTo(Country, {
		foreignKey: 'country_id'
	});
	PersonAddress.belongsTo(VwCountry, {
		foreignKey: 'country_id'
	});

	Orders.belongsTo(Person, {
		foreignKey: 'customer_id'
	});

	return;
}
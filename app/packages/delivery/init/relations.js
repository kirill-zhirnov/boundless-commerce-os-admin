export default function(db) {
	const Country = db.model('country');
	const CountryText = db.model('countryText');

	Country.hasMany(CountryText, {
		foreignKey : 'country_id'
	});

	const Region = db.model('region');
	const RegionText = db.model('regionText');

	Region.hasMany(RegionText, {
		foreignKey : 'region_id'
	});

	const City = db.model('city');
	const CityText = db.model('cityText');

	City.hasMany(CityText, {
		foreignKey : 'city_id'
	});

	const Area = db.model('area');
	const AreaText = db.model('areaText');

	Area.hasMany(AreaText, {
		foreignKey : 'area_id'
	});

	City.belongsTo(Area, {
		foreignKey : 'area_id'
	});
	City.belongsTo(Region, {
		foreignKey : 'region_id'
	});

	const ShippingCity = db.model('shippingCity');
	return ShippingCity.belongsTo(City, {
		foreignKey : 'city_id'
	});
}
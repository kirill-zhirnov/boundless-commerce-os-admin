export default function (db) {
	const Lang = db.model('lang');
	const LangTitle = db.model('langTitle');
	const TaxClass = db.model('taxClass');
	const TaxRate = db.model('taxRate');

	Lang.hasMany(LangTitle, {
		foreignKey : 'lang_id'
	});

	TaxClass.hasMany(TaxRate, {
		foreignKey : 'tax_class_id'
	});

	return;
}
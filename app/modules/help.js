const help = {
	domainSetup : {
		title : 'Как настроить домен?',
		url : 'https://sellios.ru/help/article/nastroyka-domena'
	},

	jadeHowTo: {
		title : 'Как редактировать шаблоны jade?',
		url: 'https://sellios.ru/help/category/redaktirovanie-iskhodnogo-koda'
	},

	htmlPaymentForm : {
		title : 'Вы можете использовать переменные. Узнать подробнее!',
		url: 'https://sellios.ru/help/article/priyom-platezhei-s-pomoshyu-proizvolnoi-html-formy'
	},

	robokassa: {
		title: 'Как настроить робокассу?',
		url: 'https://sellios.ru/help/article/nastroika-integracii-s-robokassoi'
	},

	addProp: {
		title: 'Как добавить характеристику?',
		url: 'https://sellios.ru/help/article/sozdanie-i-vvod-sobstvennykh-kharakteristik'
	},

	aboutCrossSell: {
		title: 'Что такое блоки Cross-sell?',
		url: 'https://sellios.ru/help/article/cross-sell-prostoi-sposob-uvelichit-prodazhi'
	},

	crossSellSetRelation: {
		title: 'Как установить связь между товарами?',
		url: 'https://sellios.ru/help/article/kak-ustanovit-svyaz-mezhdu-tovarami-s-etim-tovarom-pokupayut-ili-pokhozhie-tovary'
	},

	productWhatIsSeoTitleAndMeta: {
		title: 'Что такое Title и Meta-Description?',
		url: 'https://sellios.ru/help/article/vvedenie-v-seo-chto-takoe-title-i-meta-description'
	},

	productSEOTpls: {
		title: 'Как написать SEO шаблон?',
		url: 'https://sellios.ru/help/article/seo-shablony'
	},

	productForm: {
		title: 'Справка',
		url: 'https://sellios.ru/help/category/rabota-s-tovarami'
	},

	whatIsVariant: {
		title: 'Что такое варианты?',
		url: 'https://sellios.ru/help/article/sozdanie-variantov'
	},

	howToCreateVariant: {
		title: 'Как создать варианты товара?',
		url: 'https://sellios.ru/help/article/sozdanie-variantov'
	},

	import: {
		title: 'Справка по импорту',
		url: 'https://sellios.ru/help/article/kakie-formaty-importa-podderzhivayutsya'
	},

	shippingMarkUp: {
		title: 'Как задать наценку на доставку?',
		url: 'https://sellios.ru/help/article/kak-zadat-nacenku-na-dostavku'
	}
};

module.exports.get = key => help[key];
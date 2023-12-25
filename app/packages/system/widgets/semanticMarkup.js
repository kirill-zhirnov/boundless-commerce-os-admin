import Widget from '../../../modules/widget/widget.client';

export default class SemanticMarkup extends Widget {
	constructor(options) {
		super(options);

		this.clientExport = false;
	}

	async run() {
		const data = this.loadData();
		return this.render('semanticMarkup', data, false);
	}

	async loadData() {
		let show = false;
		let jsonLD = null;

		const instanceRegistry = this.getInstanceRegistry();
		const semanticMarkup = await instanceRegistry.getSettings().get('cms', 'semanticMarkup');
		const openGraph = await instanceRegistry.getSettings().get('cms', 'openGraph');

		if (!Array.isArray(semanticMarkup.images)) {
			semanticMarkup.images = [];
		}

		if (!semanticMarkup.images.length && openGraph.img) {
			semanticMarkup.images.push(openGraph.img);
		}

		semanticMarkup.images = semanticMarkup.images.map(img => {
			return instanceRegistry.getMediaUrl(img);
		});

		if (semanticMarkup.show) {
			show = true;
			jsonLD = this.generateJsonJD(semanticMarkup);
		}

		return {show, jsonLD};
	}

	generateJsonJD(semanticMarkup) {
		let jsonJD = {};
		if (semanticMarkup.geo.lat && semanticMarkup.geo.long) {
			//@ts-ignore
			jsonJD = {
				'@context': 'http://schema.org',
				'@type': 'LocalBusiness',
				'geo': {
					'@type': 'GeoCoordinates',
					'latitude': `${semanticMarkup.geo.lat}`,
					'longitude': `${semanticMarkup.geo.long}`
				},
				'name': `${semanticMarkup.name}`,
				'address': {
					'@type': 'PostalAddress',
					'addressCountry': `${semanticMarkup.address.country}`,
					'addressRegion': `${semanticMarkup.address.region}`,
					'addressLocality': `${semanticMarkup.address.city}`,
					'postalCode': `${semanticMarkup.address.postalCode}`,
					'streetAddress': `${semanticMarkup.address.street}`
				},
				'email': `${semanticMarkup.email}`,
				'telephone': `${semanticMarkup.telephone}`,
				'priceRange': `${semanticMarkup.priceRange}`
			};
		} else {
			//@ts-ignore
			jsonJD = {
				'@context': 'http://schema.org',
				'@type': 'Organization',
				'name': `${semanticMarkup.name}`,
				'address': {
					'@type': 'PostalAddress',
					'addressCountry': `${semanticMarkup.address.country}`,
					'addressRegion': `${semanticMarkup.address.region}`,
					'addressLocality': `${semanticMarkup.address.city}`,
					'postalCode': `${semanticMarkup.address.postalCode}`,
					'streetAddress': `${semanticMarkup.address.street}`
				},
				'email': `${semanticMarkup.email}`,
				'telephone': `${semanticMarkup.telephone}`,
				'priceRange': `${semanticMarkup.priceRange}`
			};
		}

		if (semanticMarkup.images.length) {
			//@ts-ignore
			jsonJD.image = semanticMarkup.images;
		}

		return jsonJD;
	}
}

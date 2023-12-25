const Q = require('q');
const doT = require('dot');
const fs = require('fs');
const pathAlias = require('path-alias');
const _ = require('underscore');
const BlockSample = pathAlias('@p-theme/blockSamples/blockSample');

module.exports.create = function(instanceRegistry, i18n, page) {
	if (page.type === 'landing') {
		return this.createLanding(instanceRegistry, i18n, page);
	} else {
		return this.createPage(instanceRegistry, i18n, page);
	}
};

module.exports.createLanding = function(instanceRegistry, i18n, page) {
	const deferred = Q.defer();

	Q.nfcall(fs.readFile, pathAlias.resolve('@p-cms/modules/samples/landingLayout.dot'), 'utf8')
	.then(rawLayoutTpl => {
		const layoutTplFunc = doT.template(rawLayoutTpl, _.extend({}, doT.templateSettings, {
			strip : false
		})
		);
		const layoutJadeSource = layoutTplFunc({
			pageId : page.page_id
		});

		return Q.nfcall(fs.writeFile, `${instanceRegistry.getInstancePath()}/home/landings/page${page.page_id}.jade`, layoutJadeSource, 'utf8');
}).then(() => deferred.resolve()).catch(e => deferred.reject(e)).done();

	return deferred.promise;
};

module.exports.createPage = function(instanceRegistry, i18n, page) {
	const deferred = Q.defer();

	Q.all([
		this.getContent(i18n),
		Q.nfcall(fs.readFile, pathAlias.resolve('@p-cms/modules/samples/pageLayout.dot'), 'utf8')
	])
	.spread((pageContent, rawLayoutTpl) => {
		const layoutTplFunc = doT.template(rawLayoutTpl, _.extend({}, doT.templateSettings, {
			strip : false
		})
		);
		const layoutJadeSource = layoutTplFunc({
			pageId : page.page_id,
			pageContent
		});

		return Q.nfcall(fs.writeFile, `${instanceRegistry.getInstancePath()}/home/pages/page${page.page_id}.jade`, layoutJadeSource, 'utf8');
}).then(() => deferred.resolve()).catch(e => deferred.reject(e)).done();

	return deferred.promise;
};

module.exports.getContent = function(i18n) {
	const sample = new BlockSample('text/text', i18n);
	return sample.make('block-1', 2);
};
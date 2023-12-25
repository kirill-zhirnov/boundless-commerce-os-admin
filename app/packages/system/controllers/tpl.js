import BasicController from '../../../modules/controller/basic';

//7 days web browser cache
const CACHE_DURATION = 60*60*24*7;

export default class TplController extends BasicController {
	async actionGetTpl() {
		const tpl = await this.getView()
			.localCompileClient(this.getParam('type'), this.getParam('file'), {}, this.getParam('packageName'))
		;

		this.getAnswer().setPerformWithExpress(false);

		const response = this.getFrontController().getResponse();
		if (process.env.NODE_ENV === 'production') {
			response.set('Cache-Control', `public, max-age=${CACHE_DURATION}`);
		}

		response.json({
			d: {tpl}
		});
	}

	async actionGetTplBundle() {
		const bundle = this.getParam('bundle');

		if (!bundle || !['admin', 'basic'].includes(bundle)) {
			this.rejectHttpError(404, 'Bundle not found');
			return;
		}

		const out = await this.getView().preloadClientBundle(bundle);

//			Force output in format {
//				d : <data>
//			} - because url will be called via JSONP - xhr header will not be added.

		this.getAnswer().setPerformWithExpress(false);
		const response = this.getFrontController().getResponse();
		if (process.env.NODE_ENV === 'production') {
			response.set('Cache-Control', `public, max-age=${CACHE_DURATION}`);
		}

		response.json({
			d: out
		});
	}
}

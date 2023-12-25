import BasicController from '../../../modules/controller/basic';
import {IFeedsModel, IFeedsModelStatic} from '../models/feeds';
import errors from '../../../modules/errors/errors';
import FeedExporter from '../components/feedExporter';
import {TFeedType} from '../../../@types/catalog';
import {TDataFeed} from '../components/feedExporter/types';

export default class FeedController extends BasicController {
	async actionGoogle() {
		const feedId = parseInt(this.getParam('id'));
		const feed = await (this.getModel('feeds') as IFeedsModelStatic).findOne({
			where: {
				type: TFeedType.googleShopping,
				feed_id: feedId || 0,
				deleted_at: null
			}
		});
		if (!feed) {
			throw new errors.HttpError(404, 'Feed not found');
		}

		if (feed.is_protected && !this.checkAuth(feed)) {
			this.notAuthenticated();
			return;
		}

		const dataProvider = await this.createDataProvider('@p-catalog/dataProvider/feed', {
			feed
		});

		const result = await dataProvider.getData();

		const exporter = new FeedExporter(this.getInstanceRegistry(), feed);
		const {contentType, data} = await exporter.process(result as TDataFeed);

		this.getAnswer().setPerformWithExpress(false);
		this.getFrontController().getResponse().contentType(contentType).send(data);
	}

	protected checkAuth(feed: IFeedsModel) {
		const req = this.getFrontController().getRequest();
		const auth = req.headers.authorization?.replace(/^Basic/, '');
		if (auth) {
			const [login, password] = Buffer.from(auth, 'base64').toString('utf8').split(':');

			if (login === feed.is_protected.login && password === feed.is_protected.pass) {
				return true;
			}
		}

		return false;
	}

	protected notAuthenticated() {
		this.getAnswer().setPerformWithExpress(false);
		const response = this.getFrontController().getResponse();
		response.setHeader('WWW-Authenticate', 'Basic realm="example"');
		throw new errors.HttpError(401, 'Not authenticated');
	}
}
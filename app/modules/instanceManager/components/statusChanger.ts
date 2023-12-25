import BasicComponent from './basic';
import {IHostModelStatic} from '../models/host';

export default class StatusChanger extends BasicComponent {
	public async removeMe() {
		await this.loadInstance();
		await this.setRemoveMe();
		if (this.resetCache) {
			await this.refreshInstancesCache();
		}
	}

	async changeAvailability(isAvailable) {
		try {
			await this.loadInstance();

			await (isAvailable ? this.setAvailable() : this.setUnavailable());

			if (this.resetCache) {
				await this.refreshInstancesCache();
				await this.triggerRefreshInstanceInfo();
			}
		} catch (e) {
			console.error(e);
		}
	}

	async setRemoveMe() {
		const logProps = this.reason ? {data: {reason: this.reason}} : {};

		await this.instance.changeStatus({
			status: 'awaitingForRemove',
			remove_me: this.db.fn('now'),
			available_since: null,
			unavailable_since: null,
			paid_till: null
		}, logProps);

		await (this.db.model('host') as IHostModelStatic).clearPrimaryByInstance(this.instance.instance_id);
	}

	setUnavailable() {
		const logProps = this.reason ? {data: {reason: this.reason}} : {};

		return this.instance.setUnavailable({}, logProps);
	}

	setAvailable() {
		const logProps = this.reason ? {data: {reason: this.reason}} : {};

		return this.instance.setAvailable({}, logProps);
	}
}
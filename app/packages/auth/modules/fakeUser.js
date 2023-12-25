import User from './user';

export default class FakeUser extends User {
	constructor() {
		super(...arguments);

		this.clientRegistry = null;
	}
}
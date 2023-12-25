import InstanceRegistry from '../registry/server/classes/instance';

export default class Authorization {
	/**
	 * @param {InstanceRegistry} instanceRegistry
	 */
	constructor(instanceRegistry) {
		/**
		 * @type {InstanceRegistry}
		 */
		this.instanceRegistry = instanceRegistry;
	}

//	roles = Array of roles
//	resource - ID resource
	async isAllowed(roles, resource, task = null) {
		if (!Array.isArray(roles))
			roles = [roles];

		let out = false;
		const resources = await this.getResources();
		for (const role of roles) {
			const result = await this.checkRole(resources, role, resource, task);

			if (result === false) {
				return false;
			}

			if (result === true) {
				out = true;
			}
		}

		return out;
	}

	async getResources() {
		const cache = this.instanceRegistry.getCache();

		return cache.load('authorization', async () => {
			const basicResources = await this.loadResources();
			return this.loadRules(basicResources);
		});
	}

//	Returns true/false or null if rule does not exist.
	checkRole(resources, role, resource, task = null) {
		const rule = this.getRule(resources, role, resource, task);

		if (rule !== null)
			return rule;

//		check parent rules
		if (resources[resource].resource.parent !== null) {
			return this.checkRole(resources, role, resources[resource].resource.parent, task);
		}

		return null;
	}

	getRule(resources, role, resource, task = null) {
		if (!(resource in resources)) {
			throw new Error(`Resource '${resource}' does not exist.`);
		}

		if ((task !== null) && resources[resource].tasks && resources[resource].tasks[task] && role in resources[resource].tasks[task]) {
			return resources[resource].tasks[task][role];
		}

		if (resources[resource].rules && role in resources[resource].rules) {
			return resources[resource].rules[role];
		}

		return null;
	}

	async loadResources() {
		const db = this.instanceRegistry.getDb();
		const rows = await db.sql(`
			select
				resource_id,
				parent_id,
				alias
			from
				vw_auth_resource_flat
			order by tree_sort
		`);

		const resources = {};
		const aliases = {};

		for (const row of rows) {
			let parentAlias;
			//@ts-ignore
			const resourceAlias = row.alias;
			//@ts-ignore
			aliases[row.resource_id] = row.alias;

			//@ts-ignore
			if (row.parent_id	 !== null) {
				//@ts-ignore
				parentAlias = aliases[row.parent_id];
			} else {
				parentAlias = null;
			}

			resources[resourceAlias] = {
				resource: {
					parent: parentAlias
				}
			};
		}

		return resources;
	}

	async loadRules(resources) {
		const db = this.instanceRegistry.getDb();
		const rows = await db.sql(`
			select
				role.alias as role,
				resource.alias as resource,
				task.alias as task,
				task_resource.alias as task_resource,
				is_allowed
			from
				auth_rule
				inner join role role using(role_id)
				left join auth_resource resource using(resource_id)
				left join auth_task task using(task_id)
				left join auth_resource task_resource on task.resource_id = task_resource.resource_id
		`);

		for (const row of rows) {
			//@ts-ignore
			const {role, is_allowed: isAllowed} = row;
			//@ts-ignore
			let	 resource, task = row.task;
			if (task) {
				//@ts-ignore
				resource = row.task_resource;
			} else {
				task = null;
				//@ts-ignore
				resource = row.resource;
			}


			if (!(resource in resources))
				throw new Error(`Resource '${resource}' does not exist.`);

			if (task != null) {
				if (!resources[resource].tasks) {
					resources[resource].tasks = {};
				}

				if (!resources[resource].tasks[task]) {
					resources[resource].tasks[task] = {};
				}

				resources[resource].tasks[task][role] = isAllowed;
			} else {
				if (!resources[resource].rules) {
					resources[resource].rules = {};
				}

				resources[resource].rules[role] = isAllowed;
			}
		}

		return resources;
	}
}
import {IAuthResource, IAuthTask} from '../../@types/auth';
import ExtendedSequelize from '../db/sequelize';
import {IRole, TRoleAlias} from '../../@types/person';

/**
 * @param db
 * @param resource - string like: "auth:login"
 */
export async function createResource(db: ExtendedSequelize, resource: string): Promise<IAuthResource> {
	const resourceArr = resource.split(':');

	for (let i = 0; i < resourceArr.length; i++) {
		let parentAlias = [];
		if (i > 0) {
			parentAlias = Array.from(resourceArr);
			parentAlias.splice(i, resourceArr.length - i).join(':');
		}

		const resourceAlias = Array.from(resourceArr);
		if (i < (resourceArr.length - 1)) {
			resourceAlias.splice(i + 1, resourceArr.length - i);
		}

		let parentId = null;
		if (parentAlias.length) {
			const [row] = await db.sql('select resource_id from auth_resource where alias = :alias', {alias: parentAlias.join(':')});
			if (!row) {
				throw new Error(`cant find parent resourse: '${parentAlias.join(':')}'`);
			}

			parentId = row.resource_id;
		}

		await db.sql(`
			insert into auth_resource
				(parent_id, alias, title)
			values
				(:parentId, :alias, :alias)
			on conflict do nothing
		`, {
			parentId,
			alias: resourceAlias.join(':')
		});
	}

	const [row]  = await db.sql<IAuthResource>('select * from auth_resource where alias = :alias', {alias: resource});
	if (!row) {
		throw new Error(`something went wrong - cant find added resource: '${resource}'`);
	}

	return row;
}

export async function createTask(db: ExtendedSequelize, parentResource: string, taskAlias: string): Promise<IAuthTask> {
	const resource = await createResource(db, parentResource);

	await db.sql(`
		insert into auth_task
			(resource_id, alias, title)
		values
			(:resource, :alias, :alias)
		on conflict do nothing
	`, {
		resource: resource.resource_id,
		alias: taskAlias
	});

	const [row] = await db.sql<IAuthTask>('select * from auth_task where alias = :alias', {alias: taskAlias});
	return row;
}

export async function grantAccess(db: ExtendedSequelize, roleAlias: TRoleAlias, resourceAlias: string, taskAlias: string|null = null, isAllowed: boolean = true) {
	const resource = await createResource(db, resourceAlias);
	const task = taskAlias ? await createTask(db, resourceAlias, taskAlias) : null;
	const [role] = await db.sql<IRole>('select * from role where alias = :roleAlias', {roleAlias});

	await db.sql(`
		insert into auth_rule
			(role_id, resource_id, task_id, is_allowed)
		values
			(:roleId, :resourceId, :taskId, :isAllowed)
		on conflict do nothing
	`, {
		roleId: role.role_id,
		resourceId: task ? null : resource.resource_id,
		taskId: task ? task.task_id : null,
		isAllowed
	});
}
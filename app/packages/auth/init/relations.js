import ExtendedSequelize from '../../../modules/db/sequelize'; //eslint-disable-line no-unused-vars

/**
 * @param {ExtendedSequelize} db
 */
export default function (db) {
	// authResource - authTask - authRule
	const AuthResource = db.model('authResource');
	const AuthTask = db.model('authTask');
	const AuthRule = db.model('authRule');
	const Role = db.model('role');

	AuthResource.belongsTo(AuthResource, {
		foreignKey: 'parent_id'
	});
	AuthTask.belongsTo(AuthResource, {
		foreignKey: 'resource_id'
	});
	AuthRule.belongsTo(AuthResource, {
		foreignKey: 'resource_id'
	});
	AuthRule.belongsTo(Role, {
		foreignKey: 'role_id'
	});
	AuthRule.belongsTo(AuthTask, {
		foreignKey: 'task_id'
	});

	return;
}
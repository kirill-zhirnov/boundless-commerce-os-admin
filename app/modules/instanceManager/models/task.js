import ExtendedModel from '../../db/model';
import Q from 'q';
import moment from 'moment';

export default function (sequelize, DataTypes) {
	class Task extends ExtendedModel {
		static findToExec() {
			const deferred = Q.defer();

			this.sequelize.sql('\
select \
task.*, \
log.completed_at \
from \
task \
inner join instance using(instance_id) \
left join ( \
select \
task_id, \
max(completed_at) as completed_at \
from \
task_log \
group by task_id \
) log using(task_id) \
where \
instance.status = \'available\' \
and task.stream_id is null \
and task.deleted_at is null\
').then(rows => {
				const toExec = [];

				for (let row of Array.from(rows)) {
					//@ts-ignore
					const {completed_at, cron_rule} = row;
					if (!completed_at) {
						toExec.push(row);
						continue;
					}

					const completedAt = moment(completed_at);

					switch (cron_rule) {
						case 'every_1_hour':
							if (completedAt.isBefore(moment().subtract(1, 'hour'))) {
								toExec.push(row);
							}
							break;
						case 'every_2_hours':
							if (completedAt.isBefore(moment().subtract(2, 'hour'))) {
								toExec.push(row);
							}
							break;
						case 'every_1_day':
							if (completedAt.isBefore(moment().subtract(1, 'day'))) {
								toExec.push(row);
							}
							break;
					}
				}

				return deferred.resolve(toExec);
			});

			return deferred.promise;
		}
	}

	Task.init({
		task_id: {
			type: DataTypes.INTEGER,
			primaryKey: true,
			autoIncrement: true
		},

		type: {
			type: DataTypes.TEXT
		},

		instance_id: {
			type: DataTypes.INTEGER
		},

		stream_id: {
			type: DataTypes.INTEGER
		},

		local_id: {
			type: DataTypes.INTEGER
		},

		cron_rule: {
			type: DataTypes.INTEGER
		},

		deleted_at: {
			type: DataTypes.DATE
		}
	}, {
		tableName: 'task',
		modelName: 'task',
		deletedAt: 'deleted_at',
		sequelize
	});

	return Task;
}
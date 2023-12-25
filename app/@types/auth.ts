export interface IAuthResource {
	resource_id: number;
	parent_id: number|null;
	alias: string;
	title: string;
}

export interface IAuthTask {
	task_id: number;
	resource_id: number;
	alias: string;
	title: string|null;
}

export interface IApiToken {
	token_id: number,
	name: string|null,
	client_id: string|null,
	secret: string|null,
	permanent_token: string|null,
	require_exp: boolean,
	created_at: string,
	deleted_at: string|null,
	is_system: boolean;
	can_manage: boolean;
}
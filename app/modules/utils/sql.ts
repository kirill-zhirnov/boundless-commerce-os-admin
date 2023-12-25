export function sqlAggArr2Objects(input: IAggrInput|null, defaultValue = []) {
	if (!input) return defaultValue;

	const out = [];
	for (const [key, values] of Object.entries(input)) {
		values.forEach((value, i) => {
			out[i] = out[i] || {};
			out[i][key] = value;
		});
	}
	return out;
}

interface IAggrInput {
	[key: string]: any[];
}
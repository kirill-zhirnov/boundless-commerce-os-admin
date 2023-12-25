export function convertResponse(suggestion, data) {
	const out = {
		query: suggestion,
		suggestions: []
	};

	for (let item of Array.from(data)) {
		out.suggestions.push({
			value: item.value || item.label || '',
			data: item
		});
	}

	return out;
}

export function highlight(search, value) {
	search = search.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
	const re = new RegExp('(' + search.split(' ').join('|') + ')', 'gi');

	return value.replace(re, '<b>$1</b>');
}
export default function($) {
	const nameRegExp = /^([^[]+)(\[.+)?$/i;
	const suffixRegExp = /\[([^[]*)\]/ig;
	const intRegExp = /^[0-9]+$/;

	const parseName = function(name) {
		const out = [];

		const result = name.match(nameRegExp);

		if (!result) {
			return out;
		}

		out.push(result[1]);

		if (result[2]) {
			let match = null;
			while ((match = suffixRegExp.exec(result[2]))) {
				out.push(match[1]);
			}
		}

		return out;
	};

	const isKeyArr = function(arr, key) {
		const val = arr[key];
		if (val === '') {
			return true;
		}

		return false;
	};

	$.fn.serializeObject = function() {
		const out = {};
		const serializedArr = this.serializeArray();

		$.each(serializedArr, function() {
			const nameArr = parseName(this.name);

			const lastKey = nameArr.length - 1;

			let obj = out;
			for (let key = 0; key < nameArr.length; key++) {
				const objIndex = nameArr[key];
				if (key === lastKey) {
					if (Array.isArray(obj)) {
						obj.push(this.value);
					} else {
						obj[objIndex] = this.value;
					}
				} else {
					const childObject = isKeyArr(nameArr, key + 1) ? [] : {};
					let childKey = null;

					if (Array.isArray(obj)) {
						obj.push(childObject);
						childKey = obj.length - 1;
					} else {
						childKey = objIndex;
						if (typeof(obj[childKey]) === 'undefined') {
							obj[childKey] = childObject;
						}
					}

					obj = obj[childKey];
				}
			}
		});

		return out;
	};
}
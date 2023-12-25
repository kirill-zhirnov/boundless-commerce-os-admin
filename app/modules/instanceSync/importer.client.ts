import serializer from '../serializer.client';

export function importInstancesToClient(data) {
	for (const [type, dataList] of Object.entries(data)) {
		// eslint-disable-next-line
		for (const [id, props] of Object.entries(dataList)) {
			const instance = serializer.unSerialize(props);

			switch (type) {
				case 'widget':
					instance.afterCSExport();
					break;
			}
		}
	}
}
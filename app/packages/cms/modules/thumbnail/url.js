import * as thumbnailSize from './size';
import {wrapperRegistry} from '../../../../modules/registry/server/classes/wrapper';

// Resize type can be: (string) original|thumb|scaled
// Size: (string) s|m|l
// imgProportion: (string)
// "2/3" or "3/2" - Camera
// "4/5" or "5/4" - Instagram
// "3/4" or "4/3" - Mobile phone
// "1/1" Square
export function getAttrs(instanceRegistry, image, resizeType, size = null, imgProportion = null) {
	if ((resizeType !== 'original') && !size) {
		throw new Error('size cannot be empty!');
	}

	const {mediaServer, folderPrefix} = wrapperRegistry.getConfig().instanceS3Storage;
	let imgUrl = mediaServer;
	if (resizeType == 'original') {
		imgUrl += '/original/';
	} else {
		imgUrl += '/thumb/';
	}

	if (folderPrefix)
		imgUrl += `${folderPrefix}/`;


	imgUrl += `i${instanceRegistry.getInstanceInfo().instance_id}/${image.path}`;

	const params = {mode: 'scale'};
	// suffix is 3 parts:
	// <resizeType:or|th|sc>-<subType(for thumbs only)>-<size>
	switch (resizeType) {
		case 'thumb':
			if (!imgProportion) {
				throw new Error('You have to pass imgProportion for thumb resize');
			}

			params['max-size'] = thumbnailSize.getSizeByAlias(size);
			if (imgProportion === 'sc') {
				resizeType = 'scaled';
			} else if (imgProportion === 'scf') {
				params.pad = '1';
				resizeType = 'scaled-fill';
			} else {
				params.ratio = imgProportion.replace('/', '-');
			}
			break;

		case 'scaled':
			params['max-size'] = thumbnailSize.getSizeByAlias(size);
			break;

		default:
			throw new Error(`Unknown resize type: '${resizeType}'`);
	}

	if (resizeType !== 'original') {
		imgUrl += '?' + instanceRegistry.getRouter().createGetStr(params);
	}

	const thumbSize = thumbnailSize.calc(image.width, image.height, resizeType, size, imgProportion);

	return {
		src: imgUrl,
		width: thumbSize.width,
		height: thumbSize.height
	};
}
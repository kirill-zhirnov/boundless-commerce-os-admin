import imageMagick from 'node-imagemagick';
import {promisify} from 'util';

const identifyIM = promisify(imageMagick.identify);
const convertIM = promisify(imageMagick.convert);

const dimensionRegExp = /(\d+)x(\d+)/;

/**
 * I want to use imageMagick library to detect image info because other
 * native libraries sometimes crash if img contains wrong EXIF data.
 *
 * ImageMagick much more reliable, but it doesn't respect EXIF orientation, as a result
 * width and height are mixed up.
 *
 * @param imgPath
 * @returns {Promise<{width: number; height: number;}>}
 */
export async function identify(imgPath) {
	let out = {
			width: null,
			height: null
		}
	;

	try {
		let identifyRes = await identifyIM(['-format', '%wx%h', imgPath]);
		Object.assign(out, extractDimension(identifyRes));

		let autoOrientRes = await convertIM(['-auto-orient', imgPath, '-format', '%wx%h', 'info:']);
		Object.assign(out, extractDimension(autoOrientRes));
	} catch (e) {
		console.error(e);
	}

	return out;
}

function extractDimension(result) {
	let out = {};

	if (!result) {
		return out;
	}

	let matchRes = String(result).match(dimensionRegExp);
	if (matchRes) {
		out.width = parseInt(matchRes[1]);
		out.height = parseInt(matchRes[2]);
	}

	return out;
}

/**
 * @param {string} imgPath
 * @returns {Promise<null|string>}
 */
export async function getImgType(imgPath) {
	try {
		const identifyRes = await identifyIM(['-verbose', imgPath]);
		const matchRes = identifyRes.match(/Mime type: (.+)/);

		if (matchRes) {
			return matchRes[1];
		}
	} catch (e) {
		console.error(e);
	}

	return null;
}
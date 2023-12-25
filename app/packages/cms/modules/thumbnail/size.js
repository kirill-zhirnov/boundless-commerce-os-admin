export function calc(originalWidth, originalHeight, resizeType, size = null, imgProportion = null) {
	let thumbWidth = null;
	let thumbHeight = null;
	const maxSize = size ? this.getSizeByAlias(size) : null;

	switch (resizeType) {
		case 'original':
			thumbWidth = originalWidth;
			thumbHeight = originalHeight;
			break;

		case 'thumb': {
			const thumbSize = this.calcThumbSizeByProportion(maxSize, imgProportion);

			thumbWidth = thumbSize.width;
			thumbHeight = thumbSize.height;
			break;
		}

		case 'scaled': {
			let requestedWidth = maxSize;
			let requestedHeight = maxSize;

			if (requestedWidth > originalWidth) {
				requestedWidth = originalWidth;
			}

			if (requestedHeight > originalHeight) {
				requestedHeight = originalHeight;
			}

			if (originalWidth > originalHeight) {
				thumbWidth = requestedWidth;
				thumbHeight = this.calcProportion(originalHeight, requestedWidth, originalWidth);
			} else {
				thumbWidth = this.calcProportion(originalWidth, requestedHeight, originalHeight);
				thumbHeight = requestedHeight;
			}
			break;
		}

		case 'scaled-fill': {
			let thumbSize = this.calcThumbSizeByProportion(maxSize, '1/1');

			thumbWidth = thumbSize.width;
			thumbHeight = thumbSize.height;
			break;
		}
	}

	return {
		width: thumbWidth,
		height: thumbHeight
	};
}

export function calcProportion(mul1, mul2, divider) {
	const result = (mul1 * mul2) / divider;
	return Math.round(result);
}

export function calcThumbSizeByProportion(maxSize, imgProportion) {
	let thumbHeight, thumbWidth;
	const parts = imgProportion.split('/');

	const width = parseInt(parts[0]);
	const height = parseInt(parts[1]);

	if (width === Math.max(width, height)) {
		thumbWidth = maxSize;
		thumbHeight = this.calcProportion(maxSize, height, width);
	} else {
		thumbWidth = this.calcProportion(maxSize, width, height);
		thumbHeight = maxSize;
	}

	return {
		width: thumbWidth,
		height: thumbHeight
	};
}

export function getSizeByAlias(size) {
	size = String(size);
	if (['100', '150', '250', '300', '350', '480', '600', '700', '900', '960', '1200', '1400'].includes(size)) {
		return parseInt(size);
	}

	switch (size) {
		case 'xs':
			return 100;

		case 's':
			return 200;

		case 'm':
			return 400;

		case 'l':
			return 800;

		case 'lightbox':
			return 1800;
	}

	return false;
}

export const getImgProportions = () => [
//		Camera
	'2/3',
	'3/2',
//		Instagram
	'4/5',
	'5/4',
// 		Mobile phones
	'3/4',
	'4/3',
//		Square
	'1/1',
//		Scale
	'sc',
//		Scale and fill
	'scf'
];
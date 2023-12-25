import imageMagick from 'node-imagemagick';
import path from 'path';
import fs from 'fs';
import mkdirp from 'mkdirp';
import thumbnailSize from './thumbnail/size';
import {promisify} from 'util';

const mkdirpPromise = promisify(mkdirp);
const convertPromise = promisify(imageMagick.convert);

const localPathRegExp = /^([^-]+)((?:-[\w]+){1,3})(\.\w+)$/i;

export default class Thumbnail {
	constructor(instanceRegistry, localPath) {
		this.instanceRegistry = instanceRegistry;
		this.localPath = localPath;
		this.absolutePath = null;
		this.cmdArgs = ['-strip'];
		this.nameSuffix = [];
		this.isOriginal = false;

		this.thumbPath = {
			local : null,
			absolute : null,
			www : null
		};
	}

	async process() {
		this.parseLocalPath();
		this.createThumbPath();

		if (!this.doesOriginalExist())
			throw new Error(`Image not found: ${this.localPath}`);

		if (!this.doesThumbExist()) {
			await this.createPublicPath();
			await this.createThumb();
		}

		return this.thumbPath;
	}

	async createPublicPath() {
		return mkdirpPromise(path.dirname(this.thumbPath.absolute));
	}

	doesOriginalExist() {
		return fs.existsSync(this.absolutePath);
	}

	doesThumbExist() {
		return fs.existsSync(this.thumbPath.absolute);
	}

	thumb(width, height) {
		this.addCmdArgs(['-resize', `${width}x${height}^\>`]);
		this.addCmdArgs(['-gravity', 'center', '-extent', `${width}x${height}`]);
	}

	scaled(width, height) {
		this.addCmdArgs(['-thumbnail', `${width}x${height}\>`]);
	}

	scaledAndFilled(width, height) {
		this.addCmdArgs(['-resize', `${width}x${height}\>`]);
		this.addCmdArgs(['-size', `${width}x${height}`, 'xc:white', '+swap', '-gravity', 'center']);
		this.addCmdArgs(['-composite']);
	}

	original() {
		return this.isOriginal = true;
	}

	async createThumb() {
		const ext = path.extname(this.absolutePath).toLowerCase();

		if (!this.isOriginal && (['.jpg', '.jpeg'].indexOf(ext) !== -1)) {
			this.addCmdArgs(this.getJpgArgs());
		}

		this.cmdArgs.unshift('-auto-orient');
		this.cmdArgs.unshift(this.absolutePath);

		this.cmdArgs.push(this.thumbPath.absolute);

		return convertPromise(this.cmdArgs);
	}

	createThumbPath() {
		const ext = path.extname(this.absolutePath);
		const baseName = path.basename(this.absolutePath, ext);
		const dirName = path.dirname(this.absolutePath);
		const pathPrefix = dirName.replace(`${this.getMediaPath()}/`, '');

		const nameArr = [baseName].concat(this.nameSuffix);

		this.thumbPath.local = `${pathPrefix}/${nameArr.join('-')}${ext}`;
		this.thumbPath.absolute = `${this.getMediaPath()}/public/${this.thumbPath.local}`;
		this.thumbPath.www = `/${this.thumbPath.local}`;
	}

	getMediaPath() {
		return this.instanceRegistry.getMediaPath();
	}

	addCmdArgs(args) {
		this.cmdArgs = this.cmdArgs.concat(args);
	}

	getJpgArgs() {
		return [
			'-interlace',
			'JPEG',
			'-sampling-factor',
			'4:2:0',
			'-quality',
			'90'
		];
	}

	parseLocalPath() {
		const parts = this.localPath.match(localPathRegExp);

		if (!parts) {
			throw new Error(`Incorrect local path: '${this.localPath}'`);
		}

		this.absolutePath = `${this.instanceRegistry.getDataPath()}/${parts[1]}${parts[3]}`;

		const resizeParams = parts[2].substr(1).split('-');

		switch (resizeParams[0]) {
			case 'or':
				this.original();
				this.nameSuffix = [resizeParams[0]];
				break;

			case 'sc': {
				let maxSize = this.getSizeByAlias(resizeParams[1]);

				this.scaled(maxSize, maxSize);
				this.nameSuffix = [resizeParams[0], resizeParams[1]];
				break;
			}

			case 'scf': {
				let maxSize = this.getSizeByAlias(resizeParams[1]);
				this.scaledAndFilled(maxSize, maxSize);
				this.nameSuffix = [resizeParams[0], resizeParams[1]];
				break;
			}

			case 'th': {
				let maxSize = this.getSizeByAlias(resizeParams[1]);
				let imgProportion = String(resizeParams[2]).replace('x', '/');

				if (thumbnailSize.getImgProportions().indexOf(imgProportion) === -1) {
					throw new Error(`Incorrect imgProportion '${imgProportion}' for '${this.localPath}', instanceId: ${this.instanceRegistry.getInstanceInfo().instance_id}`);
				}

				let size = thumbnailSize.calcThumbSizeByProportion(maxSize, imgProportion);

				this.thumb(size.width, size.height);
				this.nameSuffix = [resizeParams[0], resizeParams[1], resizeParams[2]];
				break;
			}

			default:
				throw new Error(`Unknown resize type '${resizeParams[0]}' for '${this.localPath}'`);
		}
	}

	getSizeByAlias(alias) {
		const maxSize = thumbnailSize.getSizeByAlias(alias);
		if (!maxSize) {
			throw new Error(`Unknown size alias '${alias}', localPath: '${this.localPath}'`);
		}

		return maxSize;
	}
}

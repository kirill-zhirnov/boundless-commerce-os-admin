import Form from '../../../../../modules/form/index';
import Uploader from '../../../modules/uploader';
import fileValidator from '../../../../../modules/form/validators/fileByUploader';
import {wrapperRegistry} from '../../../../../modules/registry/server/classes/wrapper';
import imageMagick from 'node-imagemagick';
import path from 'path';
import fs from 'fs';
import rfgApi from 'rfg-api';
import replace from 'frep';
import {promisify} from 'util';

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

export default class FaviconUploadForm extends Form {
	constructor(options) {
		super(options);

		this.uploader = null;
		this.mediaPublicPath = null;
		this.savedValue = null;
	}

	async setup() {
		await super.setup();

		this.mediaPublicPath = `${this.getInstanceRegistry().getMediaPath()}/public`;

		this.uploader = new Uploader(this.getController(), this.mediaPublicPath, {
			localPrefix: 'favicon'
		});
		this.uploader.setValidExtensions(['png', 'jpeg', 'jpg']);
	}

	getRules() {
		return [
			['file', 'validateFavicon', {uploader: this.uploader}]
		];
	}

	save() {
		const files = this.uploader.getFiles();

		return this.generateIcons(files[0].absolutePath);
	}

	// workaround to run validators in sequence (because of uploader.process())
	async validateFavicon(value, options, field, attributes) {
		const validator = fileValidator();
		const args = [value, options, field, attributes, this];

		await validator.apply(this, args);

		if (!this.hasErrors(field)) {
			await this.validateSize(this.uploader.getFiles()[0]);
		}
		return true;
	}

	validateSize(file) {
		imageMagick.identify(file.absolutePath, (err, result) => {
			if ((result.width < 260) || (result.height < 260)) {
				this.addError('file', 'invalidSize', this.__('Your image should be %sx%s or more for optimal results. ', [260, 260]));
			}
		});
	}

	async generateIcons(uploadedAbsolutePath) {
		const parsedPath = path.parse(uploadedAbsolutePath);
		const pathForGeneratedFiles = `${parsedPath.dir}/${parsedPath.name}`;

		const api = rfgApi.init();

		try {
			const request = api.createRequest({
				//@ts-ignore
				apiKey: wrapperRegistry.getConfig().realFaviconGeneratorKey,
				masterPicture: uploadedAbsolutePath,
				design: {
					'desktop_browser': {},
					'ios': {
						'picture_aspect': 'background_and_margin',
						'margin': '5%',
						'background_color': '#ffffff',
						'assets': {
							'ios6_and_prior_icons': false,
							'ios7_and_later_icons': false,
							'precomposed_icons': false,
							'declare_only_default_icon': true
						}
					},
					'windows': {
						'picture_aspect': 'no_change',
						'background_color': '#2d89ef',
						'assets': {
							'windows_80_ie_10_tile': true,
							'windows_10_ie_11_edge_tiles': {
								'small': false,
								'medium': true,
								'big': false,
								'rectangle': false
							}
						}
					},
					'android_chrome': {
						'picture_aspect': 'no_change',
						'manifest': {
							'name': 'name',
							'display': 'standalone',
							'orientation': 'portrait',
							'start_url': '/homepage.html'
						},
						'assets': {
							'legacy_icon': false,
							'low_resolution_icons': false
						},
						'theme_color': '#ffffff'
					},
					'safari_pinned_tab': {
						'picture_aspect': 'black_and_white',
						'threshold': 60,
						'theme_color': '#5bbad5'
					},
				}
			});
			const generateFavicon = promisify(api.generateFavicon);

			await generateFavicon(request, pathForGeneratedFiles);
			const browserConfig = `${pathForGeneratedFiles}/browserconfig.xml`;
			if (fs.existsSync(browserConfig)) {
				await this.prepareBrowserConfig(browserConfig, pathForGeneratedFiles);
			}

			const toSave = {};

			[
				'android-chrome-192x192.png',
				'android-chrome-512x512.png',
				'apple-touch-icon.png',
				'browserconfig.xml',
				'favicon-16x16.png',
				'favicon-32x32.png',
				'favicon.ico',
				'mstile-144x144.png',
				'mstile-150x150.png',
				'safari-pinned-tab.svg',
				//				'site.webmanifest'
			].forEach(fileName => {
				const filePath = `${pathForGeneratedFiles}/${fileName}`;
				if (fs.existsSync(filePath)) {
					return toSave[fileName] = filePath.replace(`${this.mediaPublicPath}/`, '');
				}
			});

			this.savedValue = toSave;
			await this.getRegistry().getSettings().set('system', 'faviconNew', toSave);

		} catch (err) {
			this.addError('file', 'faviconError', this.__('Error while generating favicon'));
			throw err;
		}

	}

	async prepareBrowserConfig(filePath, pathForGeneratedFiles) {
		// const relativePath = filePath.replace(`${this.mediaPublicPath}/`, '');
		const mstile = `${pathForGeneratedFiles}/mstile-150x150.png`.replace(`${this.mediaPublicPath}/`, '');

		let content = await readFile(filePath, {encoding: 'utf8'});

		const replacements = [
			{
				pattern: '/mstile-150x150.png',
				replacement: this.getInstanceRegistry().getMediaUrl(mstile)
			}
		];

		content = replace.strWithArr(content, replacements);
		await writeFile(filePath, content, {encoding: 'utf8'});
	}
}
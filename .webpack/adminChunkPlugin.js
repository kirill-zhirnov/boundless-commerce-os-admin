
class AdminChunkPlugin {
	constructor(options) {
		this.options = Object.assign({
			adminChunkFiles: [],
			chunkName: 'admin'
		}, options);

		if (!this.options.adminChunkFiles.length)
			throw new Error('Admin bundle must be specified!');
	}

	apply(compiler) {
		compiler.hooks.compilation.tap("AdminChunkPlugin", (compilation) => {
			// webpack 4:
			// compilation.hooks.optimizeChunksAdvanced.tap("AdminChunkPlugin", (chunks) => {
			compilation.hooks.afterChunks.tap("AdminChunkPlugin", (chunks) => {
				let adminChunk;

				let moveToAdmin = [];
				chunks.forEach((chunk) => {
					if (chunk.name == this.options.chunkName) {
						adminChunk = chunk;
					} else {
						chunk.getModules().forEach((module) => {
							if (this.shouldBeInAdmin(module)) {
								moveToAdmin.push(module);
								chunk.removeModule(module);
							}
						});
					}
				});

				if (!adminChunk)
					return;

				moveToAdmin.forEach((module) => {
					adminChunk.addModule(module);
					module.addChunk(adminChunk);
				});
			});
		});
	}

	shouldBeInAdmin(module) {
		let pathWithoutExt = String(module.resource).replace(/\.[^\.]+$/i, '');
		if (this.options.adminChunkFiles.indexOf(pathWithoutExt) != -1) {
			return true;
		}

		return false;
	}
}

module.exports = AdminChunkPlugin;
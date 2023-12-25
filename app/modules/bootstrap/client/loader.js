window.bb = {};

(function(src) {
	window.bb.onReadyQueue = [];
	window.bb.ready = function(callback) {
		if ('isReady' in window.bb && (window.bb.isReady === true)) {
			callback.call(window, window.bb.registry);
		} else {
			window.bb.onReadyQueue.push(callback);
		}
	};

	const loadScript = function() {
		const script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.src = src;

		const anotherScriptInDoc = document.getElementsByTagName('script')[0];
		anotherScriptInDoc.parentNode.insertBefore(script, anotherScriptInDoc);
	};

	loadScript();
})('{SCRIPT_SRC}');
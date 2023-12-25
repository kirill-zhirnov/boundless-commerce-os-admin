import $ from 'jquery';

export function copyMultiEl2Clipboard(animateElement: HTMLElement, copyElements: HTMLElement[], animate: TAnimateOnCopy|false = TAnimateOnCopy.heartBeat) {
	const out = [];
	for (const elem of copyElements) {
		out.push($(elem).text().trim() || '');
	}
	copy2Clipboard(out.join('\n'));

	if (animate) {
		($(animateElement) as JQuery & IAnimateCss).animateCss(animate);
	}
}

export function copyEl2Clipboard(element: HTMLElement, animate: TAnimateOnCopy|false = TAnimateOnCopy.heartBeat) {
	copy2Clipboard($(element).text().trim());

	if (animate) {
		($(element) as JQuery & IAnimateCss).parent().animateCss(animate);
	}
}

export function copy2Clipboard(text: string) {
	const $temp = $('<textarea>').val(text).appendTo('body').select();
	document.execCommand('copy');
	$temp.remove();
}

enum TAnimateOnCopy {
	headShake = 'headShake',
	heartBeat = 'heartBeat',
}

interface IAnimateCss {
	animateCss: (cssClasses: string, callback?: () => any, options?: {
		appendClass?: string;
		timeLimit?: number;
	}) => void
}
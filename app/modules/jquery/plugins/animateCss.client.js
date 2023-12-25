import _ from 'underscore';

const animationEndEvents = 'animationend webkitAnimationEnd oAnimationEnd MSAnimationEnd transitionend webkitTransitionEAnind oTransitionEnd MSTransitionEnd';

export default function ($) {
	/**
	 * timeLimit - needs to call callback even if animation is turned off by @media(prefers-reduced-motion) rule.
	 */
	$.fn.animateCss = function (cssClasses, callback = null, options = {}) {
		_.defaults(options, {
			appendClass: 'animated',
			timeLimit: 1100
		});

		if (options.appendClass)
			cssClasses += ` ${options.appendClass}`;

		return this.each(function () {
			let execCallback = () => {
				$(this).removeClass(cssClasses);

				if (_.isFunction(callback)) {
					callback.call(this);
				}
			};

			let timer = setTimeout(() => execCallback(), options.timeLimit);
			$(this)
				.one(animationEndEvents, null, cssClasses, function () {
					clearTimeout(timer);
					execCallback();
				})
				.addClass(cssClasses)
			;
		});
	};
}
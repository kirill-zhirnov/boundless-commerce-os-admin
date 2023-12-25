// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
class AnimationOnScroll {
	constructor() {
		this.$els = null;
		this.$window = $(window);
	}

	init() {
		this.$els = $('[data-aos]');

		if (this.shallRun()) {
			this.startAos();
		}

		return this.$window.on('resize.aos orientationchange.aos', _.debounce( () => {
			if (this.shallRun()) {
				return this.startAos();
			} else {
				return this.endAos();
			}
		}
		, 50)
		);
	}

	startAos() {
		this.checkVisibility();
		return this.$window.on('scroll.aos', _.throttle( () => {
			return this.checkVisibility();
		}
		, 90)
		);
	}

	endAos() {
		return this.$window.off('scroll.aos');
	}

	checkVisibility() {
		if (!this.$els) {
			return;
		}

		const windowHeight = this.$window.height();
		const windowBottomLine = windowHeight + this.$window.scrollTop();
		let removed = false;

		this.$els.each((i, el) => {
			const $el = $(el);

			const coefficient = windowHeight * 0.2;

			if (!$el.hasClass('animated') && (($el.offset().top + coefficient) < windowBottomLine)) {
				removed = true;
				return $el.addClass(`animated ${$el.data('aos')}`);
			}
		});

		// remove elements from an array to don't spend time for loop on next event
		if (removed) {
			this.$els = this.$els.filter(':not(.animated)');

			if (!this.$els.length) {
				return this.remove();
			}
		}
	}

	shallRun() {
		return this.$window.innerWidth() >= 768;
	}

	remove() {
		this.$window.off('.aos');
		return this.$els = null;
	}
}

module.exports = AnimationOnScroll;
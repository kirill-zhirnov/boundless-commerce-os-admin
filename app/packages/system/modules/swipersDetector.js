export default class SwipersDetector {
	constructor(element, options = {}) {
		this.options = Object.assign({minDiff: null}, options);

		this.$elem = element;

		this.touchStart = null;
		this.touchEnd = null;

		this.onTouchStart = this.onTouchStart.bind(this);
		this.onTouchEnd = this.onTouchEnd.bind(this);
	}

	onTouchStart(evt) {
		this.touchStart = evt.touches[0];
	}

	onTouchEnd(evt) {
		let direction = null;
		let diff = null;

		this.touchEnd = evt.changedTouches[0];

		if (!!this.touchStart && !!this.touchEnd) {
			if (this.touchStart.clientX > this.touchEnd.clientX) {
				direction = 'left';
			}

			if (this.touchStart.clientX < this.touchEnd.clientX) {
				direction = 'right';
			}

			diff = Math.abs(this.touchStart.clientX - this.touchEnd.clientX);

			if (this.options.minDiff && +this.options.minDiff > diff) {
				return;
			}

			const event = new CustomEvent('swiped', {
				detail: {
					direction,
					diff
				}
			});

			this.$elem.dispatchEvent(event);
		}
	}

	addEvents() {
		const el = this.$elem;
		el.addEventListener('touchstart', this.onTouchStart, false);
		el.addEventListener('touchend', this.onTouchEnd, false);
	}

	removeEvents() {
		const el = this.$elem;
		el.removeEventListener('touchstart', this.onTouchStart, false);
		el.removeEventListener('touchend', this.onTouchEnd, false);
	}
}
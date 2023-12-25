import moolah from 'moolah';

export function calcMarkUp(orderAmount, markUpPercent) {
	if (!markUpPercent) {
		return 0;
	}

	markUpPercent = markUpPercent / 100;
	return moolah(orderAmount).times(markUpPercent).float();
}

export function maskPhoneText(value: string) {
	if (!value) return '';

	const $temp = $('<input>') as JQuery & IMaskPhone;
	$temp.val(value).maskPhone();
	const out = $temp.val();
	$temp.unmask();

	return out;
}

interface IMaskPhone {
	maskPhone: () => void;
	unmask: () => void;
}
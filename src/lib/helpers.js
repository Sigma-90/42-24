/**
 * @type {(url: string, paramName: string) => string | undefined}
 */
export const getUrlParam = (/** @type {string} */ url, /** @type {string} */ paramName) => {
	const /** @type {any} */ uri = url || (window ? window.location.href : undefined);
	if (!uri) {
		return undefined;
	}
	const name = paramName.replace(/[\[\]]/g, '\\$&');
	const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
		results = regex.exec(url);
	if (!results) return undefined;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

/**
 * @type {(obj: object, propName: string) => boolean}
 */
export const hasProp = (/** @type {object} */ obj, /** @type {string} */ propName) =>
	Object.prototype.hasOwnProperty.call(obj, propName);

/**
 * @type {(obj: object, propName: string) => any}
 */
export const getProp = (/** @type {object} */ obj, /** @type {string} */ propName) => {
	if (hasProp(obj, propName)) {
		// @ts-ignore
		return obj[propName];
	}
	return undefined;
};

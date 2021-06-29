var DATA = {};

/* Полифилы для Хром 49 */
// NodeList.prototype.forEach()
// https://developer.mozilla.org/en-US/docs/Web/API/NodeList/forEach
if (window.NodeList && !NodeList.prototype.forEach) {
	NodeList.prototype.forEach = function(callback, thisArg) {
		thisArg = thisArg || window;
		for (var i = 0; i < this.length; i++) {
			callback.call(thisArg, this[i], i, this);
		}
	};
}
// ParentNode.append()
// https://developer.mozilla.org/ru/docs/Web/API/ParentNode/append
// Источник: https://github.com/jserz/js_piece/blob/master/DOM/ParentNode/append()/append().md
(function(arr) {
	arr.forEach(function(item) {
		if (item.hasOwnProperty('append')) {
			return;
		}
		Object.defineProperty(item, 'append', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function append() {
				var argArr = Array.prototype.slice.call(arguments),
					docFrag = document.createDocumentFragment();

				argArr.forEach(function(argItem) {
					var isNode = argItem instanceof Node;
					docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
				});

				this.appendChild(docFrag);
			}
		});
	});
})([Element.prototype, Document.prototype, DocumentFragment.prototype]);


/*
 * Сохранение данных
 */ 
function saveDATA(fn) {
//	console.log('сохраняем данные ', DATA);
	chrome.storage.local.set(
		DATA,
		()=>{if(fn)fn()}
	);
}

/*
 * Получаем данные из localstorage
 */
chrome.storage.local.get(result=>{
	DATA = result;
	if(typeof load == 'function'){
		load();
	}
});

/*
 * Следим за localstorage
 */
chrome.storage.onChanged.addListener(e=>{
	chrome.storage.local.get(result=>{
//		console.log('данные обновлены ', DATA);
		DATA = result;
	});
});


// Удаление дубликатов в массиве (треков)
function removeDublicate(tracknumber) {
	return tracknumber.filter((v, i) => tracknumber.indexOf(v) === i);
}

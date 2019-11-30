var DATA = {};

/*
 * Сохранение данныйх
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

// Получение тректов
function getTrackXHRBG(attr) {
	return new Promise((resolve, reject) => {
		var ordernumber = attr.ordernumber,
		refresh = attr.refresh;
		//var inLS = localStorage.getItem(ordernumber);
		var inLS = DATA.tracks[ordernumber];
		if (inLS && !refresh) {
			// console.log('local: ', JSON.parse(inLS));
			// return resolve([el, JSON.parse(inLS)]);
			return resolve(inLS);
		}
		var xhr = new XMLHttpRequest();
		xhr.open('GET', 'https://track.aliexpress.com/logisticsdetail.htm?tradeId=' + ordernumber);
		xhr.onload = ()=>{
			var tracknumber = [];
			if (/"logisticsNo":"(.*?)"/.exec(xhr.responseText)) {
				tracknumber.push(/"logisticsNo":"(.*?)"/.exec(xhr.responseText)[1]);
			}
			if (/"interMailNo":"(.*?)"/.exec(xhr.responseText)) {
				tracknumber.push(/"interMailNo":"(.*?)"/.exec(xhr.responseText)[1]);
			}
			if (/"lgOrderCode":"(.*?)"/.exec(xhr.responseText)) {
				tracknumber.push(/"lgOrderCode":"(.*?)"/.exec(xhr.responseText)[1]);
			}
			if (/"realMailNo":"(.*?)"/.exec(xhr.responseText)) {
				tracknumber.push(/"realMailNo":"(.*?)"/.exec(xhr.responseText)[1]);
			}
			if (/"mailNo":"(.*?)"/.exec(xhr.responseText)) {
				tracknumber.push(/"mailNo":"(.*?)"/.exec(xhr.responseText)[1]);
			}
			if (tracknumber.length > 0) {
				tracknumber = removeDublicate(tracknumber);
				//localStorage.setItem(ordernumber, JSON.stringify(tracknumber));
				DATA.tracks[ordernumber] = tracknumber;
				saveDATA();
				// console.log(ordernumber,tracknumber);
				return resolve(tracknumber);
			} else {
				return resolve([]);
			}
		}
		xhr.onerror = error => {
			console.log(error);
			return reject('Ошибка получения страницы отслеживания');
		}
		xhr.send();
	});
}


chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
		// console.log(request);
		if (request.hasOwnProperty("getTrack")){
			getTrackXHRBG(request.getTrack)
				.then(r=>{
					sendResponse(r);
				}).catch(error=>{
					sendResponse(error);
				});
			return true;
		}
		return false;
	}
)


chrome.runtime.onInstalled.addListener(details=>{
	// reason: "install"
	// reason: "update"
	if (details.reason == "install"){
		// Установка данных
		if(!DATA.hasOwnProperty('setting')){
			DATA.setting = {
				oldDesign:false,
				totalPrice: true,
				breadcrumbs: true,
				origTitle: true,
				extSearch: true,
				stopSlider: true,
				tracks: true,
				evaHide: true, // Скрываем Еву
				hideTopBannerHome: true, // Скрываем верхний баннер
				searchWithoutLogin: true // Поиск без авторизации
			};
		}
		if(!DATA.hasOwnProperty('extSetting')){
			DATA.extSetting = {
				timePrice: 500,
				timeSlider: 500,
				trackURL: 'https://gdeposylka.ru/*'
			};
		}
		if(!DATA.hasOwnProperty('tracks')){
			DATA.tracks = {};
		}
		// if(!DATA.hasOwnProperty('updateTimers')){
		// 	DATA.updateTimers = {};
		// }
		saveDATA();
	}
	if (details.reason == "update"){
		// Обновление старой БД
		if(Number(details.previousVersion) <= 2.0){
			DATA.setting.hideTopBannerHome = true; // Скрываем верхний баннер
			DATA.setting.searchWithoutLogin = true; // Поиск без авторизации
			saveDATA();
		}
	}
});
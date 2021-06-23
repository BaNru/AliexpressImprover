// Получение треков
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
		xhr.open('GET', 'https://ilogisticsaddress.aliexpress.ru/ajax_logistics_track.htm?orderId=' + ordernumber);
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


/* Функция изменения куки, переключение на другую локаль */
function changeCoockeLang(domain1,domain2){
	new Promise((resolve, reject) => {
		chrome.cookies.get({
			url:'https://aliexpress.'+domain1,
			name:'aep_usuc_f'
		},c=>{
			var loc = DATA.extSetting.intl_locale.split(/\s|,|\|/);
			if(loc.length !== 2){
				return reject('Error split locales');
			}
			if(!~c.value.indexOf('site='+loc[0]+'&')){
				c = c.value.replace(/(site=.*?(&|$))/,'site='+loc[0]+'$2');
				c = c.replace(/(b_locale=.*?(&|$))/,'b_locale='+loc[1]+'$2');
				chrome.cookies.set({
					url:'https://aliexpress.'+domain1,
					domain:'.aliexpress.'+domain2,
					name: 'aep_usuc_f',
					value: c
				},(r)=>{
					// console.log(r);
					return resolve(10);
				})
			}else{
				return resolve(1);
			}
		});
	})
}


/**
 * Получение курса валют
 */
function getExchange(cy){
	return new Promise((resolve, reject)=>{
		var d = Date.now();
		if( DATA.exchange && DATA.exchange.USD && DATA.exchange.USD.date > (d-3*60*60*1000) ){
			resolve(DATA.exchange.USD.Value);
		}else{
			fetch('https://www.cbr.ru/scripts/XML_daily.asp')
				//.then(response => response.text())
				.then(response => response.arrayBuffer())
				.then(str => {
					str = new TextDecoder("windows-1251").decode(str);
					str = (new window.DOMParser()).parseFromString(str, "text/xml")
					DATA.exchange = {};
					str.querySelectorAll('Valute').forEach(el=>{
						let id = el.getAttribute('ID');
						let name = el.querySelector('CharCode').textContent;
						DATA.exchange[name] = {
							ID : id
						};
						DATA.exchange[name]['date'] = d;
						el.querySelectorAll('*').forEach(item=>{
							DATA.exchange[name][item.tagName] = item.textContent;
						})
					})
					saveDATA();
					resolve(DATA.exchange[cy].Value||0);
				}
			)
		}
		//reject();
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
		if (request.hasOwnProperty("changeLocale") && DATA.extSetting.intl_locale){
			Promise.all([
				changeCoockeLang('ru','ru'),
				changeCoockeLang('ru','com'),
				changeCoockeLang('com','com')
			]).then(v => {
				if(v[0]+v[1]+v[2] > 5){
					sendResponse('update');
				} else {
					sendResponse('ok');
				}
			}).catch(e => {
				console.log(e);
			});
			return true;
		}
		if (request.hasOwnProperty("getExchange")){
			getExchange(request.getExchange)
			.then(r=>{
				sendResponse(r);
			})
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
				searchWithoutLogin: true, // Поиск без авторизации
				copyLinkPage: true, // Копировать ссылку товара
				ontime_delivery_protection: true, // Проверка времени заказа
				orders: true, // Слежние за заказами
				openImage: true, // Открытие картинок в новой вкладке
				exchange: true // Курс валют
			};
		}
		if(!DATA.hasOwnProperty('extSetting')){
			DATA.extSetting = {
				timePrice: 500,
				timeSlider: 500,
				trackURL: 'https://gdeposylka.ru/*',
				intl_locale: '' // 2.1.0
			};
		}
		if(!DATA.hasOwnProperty('tracks')){
			DATA.tracks = {};
		}
		// if(!DATA.hasOwnProperty('updateTimers')){
		// 	DATA.updateTimers = {};
		// }
		// Заказы
		if(!DATA.hasOwnProperty('orders')){
			DATA.orders = {};
		}
		// Хранение курса
		if(!DATA.hasOwnProperty('exchange')){
			DATA.exchange = {};
		}
		saveDATA();
	}
	if (details.reason == "update"){
		// Обновление старой БД
		if(Number(details.previousVersion) <= 2.0){
			DATA.setting.hideTopBannerHome = true; // Скрываем верхний баннер
			DATA.setting.searchWithoutLogin = true; // Поиск без авторизации
			DATA.setting.copyLinkPage = true; // Копировать ссылку товара
		}
		if(Number(details.previousVersion) <= 2.1){
			DATA.setting.orders = true;
			DATA.orders = {}; // Заказы
			DATA.extSetting.intl_locale = '';  // Переключение на другую локаль
			DATA.setting.ontime_delivery_protection = true; // Проверка времени заказа
		}
		if(Number(details.previousVersion) == 2.2){
			if(!DATA.orders)DATA.orders = {}; // Проверяем неудачное обновление заказов в предыдущей версии
		}
		if(Number(details.previousVersion) <= 2.2){
			DATA.setting.openImage = true; // Открытие картинок в новой вкладке
		}
		if(Number(details.previousVersion) <= 2.3){
			// Хранение курса
			if(!DATA.hasOwnProperty('exchange')){
				DATA.setting.exchange = true;
				DATA.exchange = {};
			}
		}
		saveDATA();
	}
});
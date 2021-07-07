const
	// Глобавльная переменная URL и URLSearchParams
	URL = document.location.href,
	URLSP = new URLSearchParams(document.location.search),
	// Регулярка получения цен из строки
	REGEXP = new RegExp(/[\d\s]+(?:\.|,)\d+/),
	REGEXP2 = new RegExp(/\d+/);

var TOTALPRICE = 0;

function load(){
	styles = "";

	/* Проверка локали */
	if(DATA.extSetting.intl_locale){
		chrome.runtime.sendMessage({changeLocale : true},(r)=>{
			if(~URL.indexOf('aliexpress.ru')){
				if(confirm('Перейти на aliexpress.com?')){
					document.location = URL.replace('aliexpress.ru','aliexpress.com');
				}
			}
			if(r == 'update' && confirm('Куки обновлены. Перезагрузить страницу?')){
				document.location = URL.replace('aliexpress.ru','aliexpress.com');
			}
		})
	}

	/* Скрываем верхний баннер */
	if(DATA.setting.hideTopBannerHome){
		styles += '.top-banner-container, [class*="styles_bannerLink"] {display:none!important}';
	}

	/* Поиск без авторизации */
	if(DATA.setting.searchWithoutLogin){
		var searchB = document.querySelector('[class*="Search-module_btnGroup"],[class*="SearchSection-module_searchButton"],.searchbar-operate-box,.header-search-btn');
		if(searchB){
			searchB.insertAdjacentHTML('afterend','<span class="AI_SWL"></span>');
			styles += `
.AI_SWL {
	right: -45px;
	background: #4a47ff url(//ae01.alicdn.com/kf/U076fc12af7c8408c9107c3e20c1fefd7G.png) 0 -1321px no-repeat;
	height: 36px;
	width: 40px;
	cursor: pointer;
	z-index: 9999;
	border-radius: 0 4px 4px 0;
}
[class*="Search-module_container"] .AI_SWL {
	border: 2px solid #4a47ff;
}
.hm-right {
	margin-left:45px;
}`;
			document.querySelector('.AI_SWL').addEventListener('click', ()=>{
				document.location.href="https://aliexpress.com/popular/"+document.querySelector('#search-key').value+'.html';
			});
		}
	}

	/* Страница товара */
	if(~URL.indexOf('/item/')){

		if(DATA.setting.totalPrice){
			var pricePar = document.querySelector('[class*="Actions-module_wrapper"],.product-action');
			if(pricePar){
				// Отрисовываем блок для вывода цены и кнопку "Пересчитать"
				pricePar.insertAdjacentHTML('beforebegin',
					'<span class="USER_totalPrice""></span><span class="USER_RunTotalPrice">Пересчитать</span>');
				ReloadTotalPrise();
				// Создаём блок для подсчёта за единицу
				document.querySelector('[class*="Sku-module"],.product-sku').insertAdjacentHTML('afterend','<small class="USER_SiglePrice" style="top:-6px;position:relative;"></small>');

				// Клик по кнопки "Пересчитать"
				document.querySelector('.USER_RunTotalPrice').addEventListener('click', ReloadTotalPrise);

				// Инициализация скрипта подсчёта при выборе характеристик товара и количества
				// Отслеживание изменения доставки пользователем не предусмотрено
				document.querySelectorAll('[class*="SkuValueBaseItem"],.product-quantity button,.sku-property-item').forEach(item => {
					item.addEventListener('click', e=>{
						setTimeout(()=>{
							ReloadTotalPrise();
							// Подсчёт за единицу. Пока оставим тут.
							if(e.target.textContent.match(REGEXP2)){
								document.querySelector('.USER_SiglePrice').textContent = parseFloat( TOTALPRICE / e.target.textContent.match(REGEXP2)[0] ).toFixed(2);
							}
						}, DATA.extSetting.timePrice||500); // Увеличить цифру 2+ раза, если не будет успевать считать
					});
				});
			}
		}

		if(DATA.setting.breadcrumbs){
			// Возавращение breadcrumb (хлебные крошек, категорий) в верх страницы
			var breadcrumb = document.querySelector('.breadcrumb'),
				productMain = document.querySelector('.product-main');
			if(breadcrumb && productMain){
				productMain.insertAdjacentHTML('afterbegin', '<div class="breadcrumb_"></div>');
				var breadcrumb_ = document.querySelector('.breadcrumb_');
				breadcrumb.querySelectorAll('a').forEach( function(element) {
				let el = element.cloneNode(true);
					breadcrumb_.append(el);
				});
				styles += '.product-main{padding-top:0}'
			}
		}

		if(DATA.setting.origTitle){
			// Показать оригинальное (на английском) название
			// ?isOrigTitle=true
			if(!document.querySelector('.product-title-switch')){
				URLSP.set("isOrigTitle", "true");
				// Отрисовываем ссылку переключения
				document.querySelector('.product-title,[class*="Name-module_container"]').insertAdjacentHTML('afterend','<div class="product-title-switch"><a href="'+ window.location.pathname + '?' + URLSP.toString() +'" class="product-title-link"><svg class="icon-svg product-title-icon" aria-hidden="true" style="font-size: 24px;"><use xlink:href="#icon-translate"></use></svg>Посмотреть оригинальное название</a></div>');
			}
		}

	}

	if(~URL.indexOf('/i/')){}

	if(~URL.indexOf('/item/') || ~URL.indexOf('/i/')){

		var id = URL.match(/(i|item)\/([0-9]+)\./);
		if(!id){return false} // Делаем временно остановку по ID тут, пока что все функции ниже зависят от ID
		var breadcrumbDef = document.querySelector('.ui-breadcrumb .container,.breadcrumb_');
		if(breadcrumbDef){
			breadcrumbDef.insertAdjacentHTML('beforeend','<div class="AIbtn"></div>');
			var AIbtn = document.querySelector('.AIbtn');
		}

		if(breadcrumbDef){
			if(DATA.setting.copyLinkPage){
				AIbtn.insertAdjacentHTML('beforeend','<span class="AIcopy"></span>');
				document.querySelector('.AIcopy').addEventListener('click', e=>{
					copyContect('https://aliexpress.com/item/'+id[2]+'.html');
					e.target.style.backgroundColor = '#bfb';
					setTimeout((el)=>{
						el.style = "";
					},1000,e.target);
				});
			}
			if(DATA.setting.oldDesign){
				AIbtn.insertAdjacentHTML('beforeend','<span class="AIolD"></span>');
				document.querySelector('.AIolD').addEventListener('click', e=>{
					if(id[1] == 'i'){
						document.location.href = 'https://aliexpress.com/item/'+id[2]+'.html';
					}else{
						document.location.href = 'https://aliexpress.com/i/'+id[2]+'.html';
					}
				})
			}
		}
	}
	/* / Страница товара */

	/**
	 * Расширяем результаты поиска
	 */
	if(~URL.indexOf('wholesale')){
		// Узнать доставку
		if(DATA.setting.searchShipping){
			var OBSEel = document.querySelector('.list-items');
			if(OBSEel){
				searchShippingRender();
				let observer = new MutationObserver((mutations)=>{
					for(let mutation of mutations) {
						for(let node of mutation.addedNodes) {
							searchShippingRender();
						}
					}
				});
				observer.observe(OBSEel, {
					childList: true,
					subtree: true
				});
			}
		}	
	}

	// Дополнительный поиск
	if(DATA.setting.extSearch){
		var breadcrumb_search = document.querySelector('.product-container .nav-breadcrumb');
		if (breadcrumb_search) {
			breadcrumb_search.insertAdjacentHTML('afterend', '<div class="next-input next-small""><input placeholder="Дополнить" autocomplete="off" value="" class="AEsearch"></div>')
			var AEsearch = document.querySelector('.AEsearch');
			AEsearch.addEventListener('keyup', e => {
				if (e.keyCode == 13) {
					let oldS = URLSP.get("SearchText");
					oldS = oldS ? oldS + "+" : "";
					URLSP.delete("SearchText");
					var u = window.location.pathname;
					if (~URL.indexOf('w/wholesale')) {
						oldS = u.replace('/w/wholesale-', '').replace('.html', '') + '+';
						u = '/wholesale';
					}
					URLSP.set("SearchText", oldS + e.target.value);
					window.location.href = u + '?' + URLSP.toString();
				}
			})
		}
	}


	// Переключение на старый дизайн
	// var navtop = document.querySelector('#nav-global');
	// url.delete("switch_new_app");
	// url.set("switch_new_app", 'n');
	// navtop.insertAdjacentHTML('afterbegin', `<style>
	// .ng-item-wrap.oldD a {
	// 	background: #ff4747;
	// 	color:#fff;
	// 	margin: 0px 5px;
	// 	display: inline-block;
	// 	padding: 0 10px;
	// 	font-weight: bold;
	// }
	// .ng-item-wrap.oldD a:hover {
	// 	background: #a63c24;
	// 	color:#fff;
	// }
	// </style>
	// <div class="ng-item-wrap oldD"><div class="ng-item"><a href="${window.location.pathname}?${url.toString()}">&#8822; старый дизайна</a></div></div>
	// `);


	// Скрытие надоедливой Евы
	if(DATA.setting.evaHide){
		document.querySelector('body').classList.add('evaHideTrue');
	}


	// Отключение aotoplay у карусели при добавление в корзину
	// Спасибо за помощь Джентльменам
	if(DATA.setting.stopSlider){
		var script = document.createElement('script')
		script.textContent =  `
		function stopSlider() {
			var tI = 0;
			var timerCard = setInterval(() => {
				tI > 20 ? clearInterval(timerCard) : tI++; // Останавливаем таймер, если элемент не найден в течение 10 секунд
				// console.log('Ищем слайдер');
				if (document.querySelector('.next-slick')) {
					setTimeout(()=>{
						document.querySelector('.next-slick')[Object.keys(document.querySelector('.next-slick'))[0]].alternate.memoizedProps.children.props.autoplay = false;
					}, ${DATA.setting['timeSlider']||500}); // Хак на дни распродаж
					clearInterval(timerCard);
				}
			}, 500);
		}
		document.querySelector('[class*="Actions-module_wrapper"],.product-action').addEventListener('click', (e) => {
			if (e.target.classList.contains('addcart')) {
				if (document.querySelector('[class*="Actions-module_wrapper"],.product-action .addcart-wrap:not([aria-expanded]) button')) {
					stopSlider();
				}
			}
			if (e.target.closest('.add-wishlist-wrap')) {
				stopSlider();
			}
		});
		`
		document.documentElement.appendChild(script)
	}

	// Номера треков на странице заказов
	if(DATA.setting.tracks){
		// Запуск скрипта отображения треков
		if (~URL.indexOf('orderList.htm') || ~URL.indexOf('order_list.htm')) {
			var ordernumbers = [];
			document.querySelectorAll('.order-info .first-row .info-body').forEach(el => {
				//localStorage.clear();
				ordernumbers.push(
					gettrack(el, el.textContent.trim())
						.then(r => {
							return r;
						}).catch(e => {
							return e;
						})
				);
			});
			Promise.all(ordernumbers).then(t => {
				t.forEach(e => {
					if (e[0] && e[1]) {
						insertTrack(e[0], e[1]);
//						DATA.tracks[e[0].textContent] = e[1];
					}
				});
//				console.log(DATA.tracks);
//				saveDATA();
			}, e => {
				console.log(e);
			});
		}
	}
	// Заказы
	if(DATA.setting.orders){
		if (~URL.indexOf('orderList.htm') || ~URL.indexOf('order_list.htm')) {
			var orders = document.querySelectorAll('#buyer-ordertable tbody');
			orders.forEach((element, i) => {
				let id = element.querySelector('.first-row .info-body').textContent;
				if(!DATA.orders.hasOwnProperty(id)){
					DATA.orders[id] = {};
				}
				DATA.orders[id].status = element.querySelector('.order-status .f-left').textContent.trim();
				DATA.orders[id].statusTime = element.querySelector('.order-status .left-sendgoods-day') && (Date.now() + Number(element.querySelector('.order-status .left-sendgoods-day').getAttribute('lefttime')));
				DATA.orders[id].price = element.querySelector('.order-amount .amount-num').textContent.trim();
				DATA.orders[id].storeName = element.querySelector('.store-info .info-body').textContent.trim();
				DATA.orders[id].storeLink = element.querySelector('.store-info a').href;
				if(!DATA.orders[id].hasOwnProperty('list')){
					DATA.orders[id].list = [];
				}
				element.querySelectorAll('.order-body').forEach((item, a) => {
					DATA.orders[id].list[a] = {
						name:item.querySelector('.product-title a').title.trim(),
						image:item.querySelector('img').src,
						amount: item.querySelector('.product-amount').textContent.trim(),
						property: item.querySelector('.product-property .val') && item.querySelector('.product-property .val').textContent.trim()
					}
				});
			});
			saveDATA();
		}
	}


	// проверка времени заказа на ontime delivery protection
	// mod by @Rimpel
	// https://gist.github.com/Rimpel/f432cf885f41d5e3d5f495d436df5666
	if(DATA.setting.ontime_delivery_protection){
		if (~URL.indexOf('orderList.htm') || ~URL.indexOf('order_list.htm')) {
			function addDays(date, days) {
				const copy = new Date(Number(date))
				copy.setDate(date.getDate() + days)
				return copy
			}

			document.querySelectorAll('#buyer-ordertable > *').forEach(el => {
				let orderDateElem = el.querySelector('tr.order-head > td.order-info > p.second-row > span.info-body');
				let deliveryProtectionPeriodElem = el.querySelector("tr.order-body > td.product-sets > div.product-right > div > div > a");

				let orderDate = new Date('1900-01-01');
				try {
					orderDate = new Date(orderDateElem.textContent);
				} catch (e) {
					console.log( orderDateElem );
				}

				if (orderDate > new Date('1900-01-01') ) {
					// получение периода защиты заказа в днях и расчет относительно текущей даты
					let deliveryProtectionPeriod = "";
					if (deliveryProtectionPeriodElem) {
						deliveryProtectionPeriod = deliveryProtectionPeriodElem.title;
						deliveryProtectionPeriod = deliveryProtectionPeriod.replace(/[^\d]/g, '');
					}
					
					//проверка подтвержденного заказа
					let orderConfirmElem = el.querySelector("tr.order-body > td.product-action > span:nth-child(1)");

					let orderConfirmed = "";
					if (orderConfirmElem) {
						orderConfirmed = orderConfirmElem.textContent;
					}

					let isOrderConfirmed = function() {
					  return orderConfirmed == 'Получено подтверждение';
					};

					let isOrderCancelled = function() {
					  return orderConfirmed == 'Заказ не отправлен' || orderConfirmed == 'Заказ отменён';
					};

					//проверка на закрытые споры
					let productActionInfoElem = el.querySelector("tr.order-body > td.product-action > a:nth-child(1)");
					let productActionInfo = "";

					if (productActionInfoElem) {
						productActionInfo = productActionInfoElem.text;
					}

					let isDisputeClosed = function() {
						return productActionInfo == 'Спор закрыт' || productActionInfo == 'Завершён';
					}

					// получение количества дней до закрытия заказа
					let daysUntilOrderClose = 0
					let pDaysUntilOrderClose = el.querySelector("tr.order-body > td.order-status > p");

					if (pDaysUntilOrderClose && pDaysUntilOrderClose.hasAttribute("lefttime")) {
						daysUntilOrderClose = pDaysUntilOrderClose.getAttribute("lefttime");
					}

					let isFewDaysTilOrderClose = daysUntilOrderClose < ( 5*24*3600*1000 ); // check if there is less than 5 days left till order close

					//вычисление количества дней от пороговой даты
					let orderDate = new Date(orderDateElem.textContent);
					let dateThreshold = addDays(orderDate, parseInt(deliveryProtectionPeriod));

					let now = new Date();
					let dateDiff = Math.round((now - dateThreshold)/1000/86400);

					//пусть теперь дата заказа отображает также и количество прошедших дней
					let daysPassed = Math.round((now - orderDate)/1000/86400);
					orderDateElem.insertAdjacentHTML( 'beforeend', ` [${daysPassed} days passed]`);

					if ( isDisputeClosed() ) {
						el.style.textDecoration = "line-through";
						el.style.backgroundColor = "lightGrey";
					}
					else if ( isOrderCancelled() ) {
						el.style.fontStyle = "italic"
						el.style.backgroundColor = "lightGrey"
					}
					else if ( dateDiff >= 0 ) {
						if ( !isOrderConfirmed() ) {
							// Подтверждения еще нет, спор не закрыт - изменение цвета даты
							orderDateElem.style.color = "red";
							if (!isFewDaysTilOrderClose) {
								orderDateElem.insertAdjacentText('afterend', `but there is still time until order close`);
							};
							orderDateElem.insertAdjacentHTML('afterend', `<h4><p class="deliveryFailed" style="color: grey">exceeded ${deliveryProtectionPeriod} days protection period by ${dateDiff} days</span></h4>`);
							if (isFewDaysTilOrderClose) {
								orderDateElem.style.color = "grey";
								el.querySelector("tr.order-head").style.backgroundColor = "OrangeRed";
							}
						} else if ( dateDiff < 15 ) {
							// если получено подтверждение, покрасить дату в другой цвет, т.к. иногда заказы закрываются автоматически по завершении периода защиты
							// для заказов с датой подтверждения более чем deliveryProtectionPeriod+15(максмальное количество дней для возможности открытия диспута)
							//это уже не актуально
							orderDateElem.style.color = "BlueViolet";
						}
					} else if ( dateDiff < 0 ) {
						if ( !isOrderConfirmed() ) {
							let dateColor = (dateDiff>-5)?"darkmagenta":"green";
							let absDateDiff = Math.abs(dateDiff);
							orderDateElem.insertAdjacentHTML('afterend', `<p class="deliveryOnGoing" style="font-weight:bold;color: ${dateColor}">${absDateDiff} days of ${deliveryProtectionPeriod} to deadline</span>`);
							orderDateElem.style.color = dateColor;
							if (dateDiff > -5) {
								el.style.backgroundColor = "DarkOrange";
							}
						} else {
							orderDateElem.style.textDecoration = "line-through";
							orderDateElem.style.fontStyle = "italic";
							orderDateElem.style.color = "grey";
							el.style.backgroundColor = "lightGreen";
						}
					}
				}
			})
		}
	}

	// Кнопка открытия картинок в новом окне
	if(DATA.setting.openImage){
		document.querySelectorAll('.images-view-item img, .pic-view-item img, .product-sets img').forEach(el=>{
			if(el.src){
				let src = el.src;
				src = src.replace(/_[0-9]+x[0-9]+\.(jpg|png)/, '').replace('_.webp', '');
				el.insertAdjacentHTML('afterend', '<a href="'+src+'" class="AIopenlink" target="_blank"></a>');
			}
		});
	}


	if(styles){
		document.querySelector('body').insertAdjacentHTML('afterend', '<style>'+styles+'</style>');
	}

}
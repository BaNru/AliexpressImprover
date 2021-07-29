const
	// Глобавльная переменная URL и URLSearchParams
	URL = document.location.href,
	URLSP = new URLSearchParams(document.location.search),
	// Регулярка получения цен из строки
	REGEXP = new RegExp(/[\d\s]+(?:\.|,)\d+/),
	REGEXP2 = new RegExp(/\d+/);

var TOTALPRICE = 0;

function load(){
	// Дожидаемся загрузки страницы
	window.addEventListener('load', ()=>{
	
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
			var pricePar = document.querySelector('[class*="Product_Actions"],[class*="Actions-module_wrapper"],.product-action');
			if(pricePar){
				// Отрисовываем блок для вывода цены и кнопку "Пересчитать"
				pricePar.insertAdjacentHTML('beforebegin',
					'<span class="USER_totalPrice""></span><span class="USER_RunTotalPrice">Пересчитать</span>');
				ReloadTotalPrise();
				// Создаём блок для подсчёта за единицу
//				document.querySelector('[class*="Sku-module"],.product-sku').insertAdjacentHTML('afterend','<small class="USER_SiglePrice" style="top:-6px;position:relative;"></small>');

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
			// ?isOrigTitle=true - больше не работает, теперь открываем оригинальную английскую страницу
			if(!document.querySelector('.product-title-switch')){
				if(document.querySelector('[hreflang="id"]')){
					// Отрисовываем ссылку переключения
					document.querySelector('.product-title,[class*="Name-module_container"]').insertAdjacentHTML('afterend','<div class="product-title-switch" style="padding: 2px 0 7px;font-size: 13px;"><a href="'+ document.querySelector('[hreflang="id"]').href +'" class="product-title-link" target="_blank"><svg style="height:18px;padding: 0px 8px 0 0;vertical-align: sub;" viewBox="0 0 1024 1024"><path d="M264 640l-35.008-97.408H94.72L60.48 640H0l131.264-352.32h62.4L324.928 640h-60.928zM162.56 335.36L108.8 496h108.8l-55.04-160.64z m624.64 320V392.192h39.424v137.856c0 9.728-0.384 23.296-1.088 40.64-0.704 17.28-1.216 27.392-1.408 30.08h1.024l129.088-208.576h52.224v263.168h-39.04V518.528c0-18.432 0.768-38.848 2.496-61.184l0.896-11.712h-1.472l-129.408 209.728H787.2z m111.104-325.248l70.336-70.336a16.384 16.384 0 1 1 23.168 23.168l-81.92 81.92c-6.4 6.4-16.768 6.4-23.168 0l-81.92-81.92a16.384 16.384 0 1 1 23.168-23.168l70.336 70.336z m-551.232-77.44l32.32-16.128a16 16 0 0 1 14.336 28.672l-81.792 40.832a16 16 0 0 1-23.296-14.592V189.44a16 16 0 1 1 32 0v45.248C361.984 180.48 418.432 152.96 488.96 152.96c89.792 0 156.736 44.608 198.72 131.968a16 16 0 1 1-28.8 13.824C622.08 222.272 566.08 184.96 488.96 184.96c-59.648 0-106.624 22.272-141.888 67.776z m359.936 487.232l-32.32 16.192a16 16 0 0 1-14.336-28.672l81.792-40.832a16 16 0 0 1 23.296 14.592v102.016a16 16 0 1 1-32 0v-45.248c-41.344 54.208-97.792 81.728-168.32 81.728-89.792 0-156.736-44.608-198.72-131.968a16 16 0 1 1 28.8-13.824c36.864 76.48 92.8 113.792 169.92 113.792 59.648 0 106.624-22.272 141.888-67.776z"></path></svg>Посмотреть оригинальное название</a></div>');
				}
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

})
}
const
	// Глобавльная переменная URL и URLSearchParams
	URL = document.location.href,
	URLSP = new URLSearchParams(document.location.search),
	// Регулярка получения цен из строки
	REGEXP = new RegExp(/[\d\s]+(?:\.|,)\d+/),
	REGEXP2 = new RegExp(/\d+/);

var TOTALPRICE = 0;

function load(){

	/* Страница товара */
	if(~URL.indexOf('/item/')){

		if(DATA.setting.totalPrice){
			// Отрисовываем блок для вывода цены и кнопку "Пересчитать"
			document.querySelector('.product-action').insertAdjacentHTML('beforebegin',
				'<span class="USER_totalPrice"">Общая сумма: ' + RunTotalPrise() + '</span><span class="USER_RunTotalPrice">Пересчитать</span>');
			// Создаём блок для подсчёта за единицу
			document.querySelector('.product-sku').insertAdjacentHTML('afterend','<small class="USER_SiglePrice" style="top:-6px;position:relative;"></small>');

			// Клик по кнопки "Пересчитать"
			document.querySelector('.USER_RunTotalPrice').addEventListener('click', ReloadTotalPrise);

			// Инициализация скрипта подсчёта при выборе характеристик товара и количества
			// Отслеживание изменения доставки пользователем не предусмотрено
			document.querySelectorAll('.product-quantity button,.sku-property-item').forEach(item => {
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
			}
		}

		if(DATA.setting.origTitle){
			// Показать оригинальное (на английском) название
			// ?isOrigTitle=true
			if(!document.querySelector('.product-title-switch')){
				URLSP.set("isOrigTitle", "true");
				// Отрисовываем ссылку переключения
				document.querySelector('.product-title').insertAdjacentHTML('afterend','<div class="product-title-switch"><a href="'+ window.location.pathname + '?' + URLSP.toString() +'"><svg class="svg-icon m product-title-icon" aria-hidden="true"><use xlink:href="#icon-translate"></use></svg>Посмотреть оригинальное название</a></div>');
			}
		}

	}
	/* / Страница товара */


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
		document.querySelector('.product-action').addEventListener('click', (e) => {
			if (e.target.classList.contains('addcart')) {
				if (document.querySelector('.product-action .addcart-wrap:not([aria-expanded]) button')) {
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
		if (~document.location.href.indexOf('orderList.htm')) {
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

}
// Вытаскиваем цены из строки и преобразуем в числа
function normaliseInt(str){
	return parseFloat(
		( str.match(REGEXP) && str.match(REGEXP)[0] || str.match(REGEXP2) && str.match(REGEXP2)[0] || 0	).replace(/\s/,'').replace(',', '.')
	);
}

// Основная функция подсчёта
function RunTotalPrise() {

	// Основная цена
	var price = document.querySelector('.product-price-value[itemprop="price"]');
	if (price && (price.textContent.match(REGEXP) || price.textContent.match(REGEXP2))) {
		price = normaliseInt(price.textContent);
	} else {
		price = 0;
	}

	// Доставка
	var shippingPrice = document.querySelector('.product-shipping-price .bold');
	if (shippingPrice && (shippingPrice.textContent.match(REGEXP) || shippingPrice.textContent.match(REGEXP2))) {
		shippingPrice = normaliseInt(shippingPrice.textContent);
	} else {
		shippingPrice = 0;
	}

	// Высчитываем
	if (price) {
		var INPUT_ = document.querySelector('.product-number-picker input').value;
		if (shippingPrice) {
			return (price * INPUT_ + shippingPrice).toFixed(2);
		} else {
			return (price * INPUT_).toFixed(2);
		}
	}
	return 0;
}

// Функция вывода цен на страницу
function ReloadTotalPrise() {
	TOTALPRICE = RunTotalPrise();
	document.querySelector('.USER_totalPrice').textContent = 'Общая сумма: ' + TOTALPRICE;
}

// Получение трека (запрос через BG к https://track.aliexpress.com/)
function gettrack(el, ordernumber, refresh){
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage({
			getTrack : {
				ordernumber:ordernumber,
				refresh:refresh
			}
		},(r)=>{
			resolve([el,r]);
		})
	})
}
// Генерация цветов (на входе 0-255 - яркость цвета)
function randomColor(brightness) {
	function randomChannel(brightness) {
		var r = 255 - brightness;
		var n = 0 | ((Math.random() * r) + brightness);
		var s = n.toString(16);
		return (s.length == 1) ? '0' + s : s;
	}
	return '#' + randomChannel(brightness) + randomChannel(brightness) + randomChannel(brightness);
}
// Вставка треков на страницу (с поиском и подсветкой дублей/консолидированных)
function insertTrack(el, track) {
	var thisBTN = el.closest('.order-item-wraper').querySelector('.order-action button');
	track.forEach(c => {
		var color = 'transparent';
		document.querySelectorAll('.inproveTrack').forEach(ie => {
			if (ie.textContent == c) {
				if(color == 'transparent'){color = randomColor(160);}
				ie.style.backgroundColor = color;
			}
		});
		var nc = DATA.extSetting.trackURL.replace(/\*/, c);
		thisBTN.insertAdjacentHTML('afterend', `
<a class="inproveTrack" href="${nc}" target="_blank" style="background:${color};">${c}</a>
`);
	});
	var trackrefresh = document.createElement('span');
	trackrefresh.className = 'trackrefresh';
	trackrefresh.textContent = '↺';
	trackrefresh.addEventListener('click', () => {
		el.closest('.order-item-wraper').querySelectorAll('.inproveTrack, .trackrefresh').forEach(r => {
			r.remove();
		});
		gettrack(el, el.textContent.trim(), true).then(e => {
			insertTrack(e[0], e[1]);
			saveDATA();
		});
	});
	thisBTN.parentNode.insertBefore(trackrefresh, thisBTN.nextSibling);
}
// Вытаскиваем цены из строки и преобразуем в числа
function normaliseInt(str){
	str = str.replace(/\s|&nbsp;/, '');// Очищаем от мусора
	return parseFloat(
		( str.match(REGEXP) && str.match(REGEXP)[0] || str.match(REGEXP2) && str.match(REGEXP2)[0] || 0	).replace(/\s/,'').replace(',', '.')
	);
}

// Основная функция подсчёта
function RunTotalPrise() {
	var retObj = {
		price: 0,
		shipping: 0,
		full: 0,
		cv: ''
	}

	// Основная цена
	var price = document.querySelector('.product-price-current .product-price-value');

	// Получение валюты
	if (price){
		retObj.cv = price.textContent.match(/\$|руб/)[0];
	}

	if (price && (price.textContent.match(REGEXP) || price.textContent.match(REGEXP2))) {
		retObj.price = normaliseInt(price.textContent);
	}

	// Доставка
	var shippingPrice = document.querySelectorAll('.delivery-info-wrapper + .freight-extra-info .freight-extra-info-detail')[1];
	if (shippingPrice && (shippingPrice.textContent.match(REGEXP) || shippingPrice.textContent.match(REGEXP2))) {
		retObj.shipping = normaliseInt(shippingPrice.textContent);
	}

	// Высчитываем
	if (retObj.price > 0) {
		var INPUT_ = (document.querySelector('.product-number-picker input') && document.querySelector('.product-number-picker input').value) || 1;
		if (retObj.shipping > 0) {
			retObj.full = parseFloat((retObj.price * INPUT_ + retObj.shipping).toFixed(2));
		} else {
			retObj.full = parseFloat((retObj.price * INPUT_).toFixed(2));
		}
	}

	return retObj;
}

// Функция вывода цен на страницу
function ReloadTotalPrise() {
	TOTALPRICE = RunTotalPrise();
	console.log(TOTALPRICE)
	// Курс
	if(DATA.setting.exchange){
		let cv = {
			'руб' : 'RUB',
			'$' : 'USD'
		};
		chrome.runtime.sendMessage({
			getExchange : 'USD'
		},(r)=>{
			var ex = parseFloat(r.replace(',','.'));
			if(TOTALPRICE.cv == '$'){
				var p = (TOTALPRICE.full * ex).toFixed(2) + ' руб.';
			}else{
				var p = '$'+ (TOTALPRICE.full / ex).toFixed(2);
			}
			document.querySelector('.USER_totalPrice').innerHTML
				= 'Общая сумма: ' + TOTALPRICE.full + ' (<i title="'+ex.toFixed(2)+'">'+p+'</i>)';
		})
	}else{
		document.querySelector('.USER_totalPrice').textContent = 'Общая сумма: ' + TOTALPRICE.full;
	}
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


/**
 * Функция копирования текста в буфер
 *
 * @param {string} text = copy text
 */
function copyContect(text){
	const input = document.createElement('input');
	input.style.position = 'fixed';
	input.style.opacity = 0;
	input.value = text;
	document.body.appendChild(input);
	input.select();
	let result =  document.execCommand('Copy', false, null);
	document.body.removeChild(input);
	return result;
}
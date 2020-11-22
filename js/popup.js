function load(){

	document.querySelectorAll('.setting li').forEach(el=>{
		el.className = DATA.setting[el.dataset.name];
	})

	document.querySelector('.setting').addEventListener('click', el=>{
		if(el.target.dataset && el.target.dataset.name){
			DATA.setting[el.target.dataset.name] = !DATA.setting[el.target.dataset.name];
			saveDATA();
			console.log(DATA.setting[el.target.dataset.name]);
			el.target.className = DATA.setting[el.target.dataset.name];
		}
	})

	document.querySelectorAll('.extSetting input').forEach((el)=>{
		el.value = DATA.extSetting[el.name];
	})

	document.querySelector('.extSetting').addEventListener('change', el=>{
		if(el.target.name){
			DATA.extSetting[el.target.name] = el.target.value;
			saveDATA();
			el.target.className = 'false';
			setTimeout(e=>{
				el.target.className = 'true';
			},500,el)
		}
	})
	// document.querySelector('.extSetting').addEventListener('keyup', function(el){
	// 	console.log(this.target);
	// 	if(el.target.nane && el.keyCode == 13){
	// 		alert(el.keyCode);
	// 	}
	// });

	// Табы
	document.querySelector('.tabs_name').addEventListener('click', el=>{
		if(el.target.tagName.toLowerCase() == 'li' && el.target.className !== 'active'){
			// let index = [...el.target.parentElement.children].indexOf(el.target);
			let index = Array.prototype.slice.call(el.target.parentElement.children).indexOf(el.target);
			document.querySelector('.tabs_name .active').classList.remove('active');
			el.target.classList.add('active');
			document.querySelector('.tabs .show').classList.remove('show');
			document.querySelectorAll('.tabs article')[index].classList.add('show');
		}
	})

	// Заказы
	var orderhtml = '';
	// TODO: добавить сортировку!
	for (let key in DATA.orders) {
		let order = DATA.orders[key];
		if(order.statusTime){
			orderhtml += '<li><a class="id" target="_blank" title="'+key+'" href="https://trade.aliexpress.com/order_detail.htm?orderId='+key+'">№</a>';
			orderhtml += '<div class="tracks">';
			if(DATA.tracks.hasOwnProperty(key)){
				DATA.tracks[key].forEach((track)=>{
					orderhtml += '<a target="_blank" href="'+DATA.extSetting.trackURL.replace(/\*/, track)+'">'+track+'</a>';
				});
				
			}
			orderhtml += '</div>';
			//let statusTime = moment(order.statusTime).endOf('minute').fromNow(true);
			let statusTime = (order.statusTime-Date.now()) / 1000 / 60 / 60;
			if(statusTime){
				if(statusTime < 24){
					orderhtml += '<strong class="status red">'+parseInt(statusTime)+' ч.</strong>';
				}else if(statusTime < 120){
					orderhtml += '<strong class="status red">'+parseInt(statusTime/24)+' д.</strong>';
				}else{
					orderhtml += '<span class="status">'+parseInt(statusTime/24)+' д.</span>';
				}
			}else{
				orderhtml += '<span class="status">'+order.status+'</span>';
			}
			orderhtml += '<a class="store" target="_blank" href="'+order.storeLink+'">'+order.storeName+'</a>';
			order.list.forEach( item=>{
				orderhtml += '<span class="orderImg"><img src="'+item.image+'"></span>';
				orderhtml += '<span class="orderName" title="'+item.name+'">'+item.name+'</span>';
				orderhtml += '<span class="orderAmount">'+item.amount+'</span>';
				orderhtml += '<span class="orderProperty">'+(item.property||'')+'</span>';
			});
			orderhtml += '</li>'
		}
	}
	if(!orderhtml){
		orderhtml = 'Пока нет заказов в истории. Появятся, когда зайдёте на страницу заказов.'
	}
	document.querySelector('.ordersList').insertAdjacentHTML('afterbegin', orderhtml);
	ToolTip();
}


function ToolTip(){
	yOffset=10;
	xOffset=20;

	document.querySelector("body").insertAdjacentHTML('beforeend', '<div id="tooltip"></div>');
	const tooltip = document.querySelector('#tooltip');

	function setPosition(e){
		if(document.querySelector('html').clientWidth / 2 < e.pageX){
			tooltip.style.left = (e.pageX-tooltip.offsetWidth-14-xOffset)+"px";
		}else{
			tooltip.style.left = (e.pageX+xOffset)+"px";
		}
		if(document.querySelector('html').clientHeight / 2 < e.pageY){
			tooltip.style.top = (e.pageY-tooltip.offsetHeight-14-yOffset)+"px";
		}else{
			tooltip.style.top = (e.pageY-yOffset)+"px";
		}
	}

	document.querySelectorAll("[title],[alt]").forEach( (element, index)=>{
		if(!element.title && !element.alt){
			return false;
		}
		element.addEventListener('mouseover',(e)=>{
			if(element.title == element.alt){
				element.t = element.alt;
			}else{
				element.t = (element.title||'') + (element.alt||'');
			}
			element.title = element.alt = "";
			tooltip.textContent += element.t;
			tooltip.style.display = 'block';
			setPosition(e);
		});
		element.addEventListener('mouseleave',()=>{
			element.title = element.t;
			tooltip.textContent = '';
			tooltip.style.display = 'none';
		});
		element.addEventListener('mousemove',(e)=>{
			setPosition(e);
		});
	});
};
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

}
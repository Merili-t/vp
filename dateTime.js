const monthNamesEt = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "august", "september", "oktoober", "november", "detsember"];
const dateFormattedEt = function(){
 //function dateFormatted(){
		let timeNow = new Date();
		let dateNow = timeNow.getDate();
		let monthNow = timeNow.getMonth();
		let yearNow = timeNow.getFullYear();
		const monthsNameEt = ["jaanuar", "veebruar", "märts", "aprill", "mai", "juuni", "juuli", "augut", "september", "oktoober", "november", "detsember"];
		//console.log("Täna on: " + dateNow + "." + (monthNow + 1) + "." + yearNow);
		//let dateEt = dateNow + "." + monthsNameEt[monthNow] + " " + yearNow;
		//return dateEt;
		return dateNow + "." + monthsNameEt[monthNow] + " " + yearNow;
}

const weekdayNamesEt = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
const weekDayEt = function(){
	let timeNow = new Date();
	let dayNow = timeNow.getDay();
	return weekdayNamesEt[dayNow];
}

const timeFormattedEt = function(){
	let timeNow = new Date();
	let hourNow = timeNow.getHours();
	let minuteNow = timeNow.getMinutes();
	let secondNow = timeNow.getSeconds();
	return hourNow + ":" + minuteNow + ":" + secondNow;
}


const partOfDay = function(){
const daysOfWeek = ["pühapäev", "esmaspäev", "teisipäev", "kolmapäev", "neljapäev", "reede", "laupäev"];
	let dPart = "suvaline aeg";

	let hourNow = new Date().getHours();

	let now = new Date();

	let dayNow = daysOfWeek[now.getDay()];
	

	if(hourNow > 8 && hourNow <= 16){
		dPart = "kooliaeg";
	} else if (hourNow > 20 && hourNow <= 22){
		dPart = "vaba aeg";
	} else if (hourNow > 23 && hourNow <= 6){
		dPart = "uneaeg";
	} else if ((dayNow === "teisipäev" || dayNow === "neljapäev") && hourNow >= 17 && hourNow <= 20) {
		dPart = "trenn"
	}
	
	return dPart;
}




//ekspordin kõik vajaliku
module.exports = {dateFormattedEt: dateFormattedEt, weekDayEt: weekDayEt, timeFormattedEt: timeFormattedEt, weekdayNames: weekdayNamesEt, monthNames: monthNamesEt, dayPart: partOfDay};


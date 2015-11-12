var defaultDateTime = moment.tz("2000-01-01", "America/New_York");
var EST = "America/New_York";

var dayOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

var fullDateFormat = "YYYY-MM-DD\\THH:mm:ssZ";

function toDateTime(m){
	return { dateTime: m.format(fullDateFormat) };
}

function toDate(m){
	return { date: m.format("YYYY-MM-DD") };
}

function getDOW(m){
	return dayOfWeek[m.day()];
}

function curTZ(){
	return (jstz.determine()).name();
}


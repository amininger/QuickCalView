var defaultTimeZone = "-5:00";
var defaultDateTime = moment.tz("2000-01-01", "America/New_York");
var EST = "America/New_York";

var dayOfWeek = ['N', 'M', 'T', 'W', 'R', 'F', 'S'];

var fullDateFormat = "YYYY-MM-DD\\THH:mm:ssZ";


function getCurTime(){
	return { dateTime: moment().format(fullDateFormat) };
}

function toDateTime(m){
	return { dateTime: m.format(fullDateFormat) };
}

function toDate(m){
	return { date: m.format("YYYY-MM-DD") };
}

function getDOW(m){
	return dayOfWeek[m.day()];
}

function createDate(month, day){
	var now = moment();
	var m = moment.tz("00:00:00", "HH:mm:ss", "America/New_York");
	m.hour(0);
	m.month(month);
	m.date(day);
	m.year(now.month() > m.month() ? m.year() + 1 : m.year());
	return m;
}



// api_getTasks(token, callback(response))
//   HTTP GET 
//   gets all non-completed tasks from detault task list
function api_getTasks(token, callback){
	console.log("google_api: getTaskData()");
  
  var reqURL = "https://www.googleapis.com/tasks/v1/lists/@default/tasks";
  reqURL += "?showDeleted=false";
  reqURL += "&showHidden=false";
  reqURL += "&showCompleted=false";

  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open('GET', reqURL);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  
  xhr.onerror = function () {
    console.log("google_api: HTTP GET ERROR [TASK]");
		console.log("  err info:");
    console.log(this);
  };

  xhr.onload = function() {
    console.log("google_api: HTTP GET SUCCESS [TASK]:");
		console.log("  response: ");
		console.log(this.response);
		callback(this.response);
  };

  console.log("Request URL: " + reqURL);

  xhr.send();
}

// api_getCalendarEvents(token, callback(response))
//   HTTP GET
//   gets all calendar events on the primary calendar in the future
function api_getCalendarEvents(token, callback){
  console.log("google_api: getCalendarData()");
    
  var reqURL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
	reqURL += "?calendarId=primary";
	reqURL += "&maxResults=200";
	reqURL += "&orderBy=startTime";
	reqURL += "&showDeleted=false";
	reqURL += "&singleEvents=true";
	reqURL += "&timeMin=" + moment.tz(EST).format(fullDateFormat);
	
  var xhr = new XMLHttpRequest();
  xhr.responseType = 'json';
  xhr.open('GET', reqURL);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  
  xhr.onerror = function () {
    console.log("google_api: HTTP GET ERROR [CAL]");
		console.log("  err info:");
    console.log(this);
  };

  xhr.onload = function() {
    console.log("google_api: HTTP GET SUCCESS [CAL]");
		console.log("  response: ");
		console.log(this.response);

		callback(this.response);
  };

  console.log("Request URL: " + reqURL);

	xhr.send();
}

// api_postTask(token, task)
//   HTTP POST 
//   creates the task on the task list  
function api_postTask(token, task){
	var postURL = "https://www.googleapis.com/";
	postURL += "tasks/v1/lists/@default/tasks";

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.open('POST', postURL);
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onerror = function () {
		console.log("google_api: HTTP POST ERROR [TASK]");
		console.log(" err info:");
		console.log(this);
	};

	xhr.onload = function() {
		console.log("google_api: HTTP POST SUCCESS [TASK]");
		console.log("  response =");
		console.log(this.response);

		task.id = this.response.id;
	};

	var body = JSON.stringify(task.getCreateBody());

	console.log("Post URL: " + postURL);
	console.log("    BODY: " + body);

	xhr.send(JSON.stringify(task.getCreateBody()));
}

// api_postCalendarEvent(token, calEvent)
//   HTTP POST 
//   creates the calendar event on the primary calendar  
function api_postCalendarEvent(token, calEvent){
	var postURL = "https://www.googleapis.com/";
	postURL += "calendar/v3/calendars/primary/events";

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.open('POST', postURL);
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onerror = function () {
		console.log("google_api: HTTP POST ERROR [EVENT]");
		console.log(" err info:");
		console.log(this);
	};

	xhr.onload = function() {
		console.log("google_api: HTTP POST SUCCESS [EVENT]");
		console.log("  response =");
		console.log(this.response);

		calEvent.id = this.response.id;
	};

	var body = JSON.stringify(calEvent.getCreateBody());

	console.log("Post URL: " + postURL);
	console.log("    BODY: " + body);

	xhr.send(body);
}

// api_putTaskCompleted(token, task)
//   HTTP PUT
//   marks the given task as completed
function api_putTaskCompleted(token, task){
	var delURL = "https://www.googleapis.com/";
	delURL += "tasks/v1/lists/@default/tasks/";
	delURL += task.id;

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.open('PUT', delURL);
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.setRequestHeader('Content-Type', 'application/json');

	xhr.onerror = function () {
		console.log("google_api: HTTP PUT ERROR [TASK]");
		console.log("  err info:");
		console.log(this);
	};

	xhr.onload = function() {
		console.log("google_api: HTTP PUT SUCCESS [TASK]");
		console.log("  response:");
		console.log(this.response);
	};

	var body = JSON.stringify( { id: task.id, status: "completed" } );

	console.log("Put URL: " + delURL);
	console.log("   BODY: " + body);

	xhr.send(body);
}

// api_deleteCalendarEvent(token, calEvent)
//   HTTP DELETE
//   deletes the given event from the calendar
function api_deleteCalendarEvent(token, calEvent){
	var delURL = "https://www.googleapis.com/";
	delURL += "calendar/v3/calendars/primary/events/";
	delURL += calEvent.id;

	var xhr = new XMLHttpRequest();
	xhr.responseType = 'json';
	xhr.open('DELETE', delURL);
	xhr.setRequestHeader('Authorization', 'Bearer ' + token);

	xhr.onerror = function () {
		console.log("google_api: HTTP DELETE ERROR [EVENT]");
		console.log("  err info:");
		console.log(this);
	};

	xhr.onload = function() {
		console.log("google_api: HTTP DELETE SUCCESS [EVENT]");
		console.log("  response:");
		console.log(this.response);
	};

	console.log("DELETE URL: " + delURL);

	xhr.send();
}



var eventManager = new EventManager();

var authToken = null;

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
    console.log("Background: GOT " + request.msg);
      if(request.msg === "authorization-request"){
        getAuthorization(true);
      } else if(request.msg === "data-request"){
        loadData();
      } else if(request.msg === "refresh-data"){
        getAuthorization(true);
      } else if(request.msg === "create-event"){
				createEvent(request.eventInfo);
			} else if(request.msg === "delete-event"){
				deleteEvent(request.eventId);
			}
    }
);

function getAuthorization(interactive){
  console.log("getAuthorization()");
  chrome.identity.getAuthToken( 
    { 'interactive': interactive }, authorizationCallback);
}

function authorizationCallback(token) {
  console.log("authorizationCallback()");
  console.log(token);

	authToken = token;
	eventManager.setAuthToken(token);

  if (token) {
    eventManager.reset();
    fetchCalendarData(token);
    fetchTaskData(token);
  } else {
    chrome.extension.sendRequest(
      { msg: "authorization-failure" });
  }
}

function loadData(){
  console.log("loadData()");
  
  if(!eventManager.isReady()){
    getAuthorization(false);
  } else {
    sendData();
  }
}


function fetchTaskData(token){
  console.log("fetchTaskData()");
  
  var reqURL = "https://www.googleapis.com/tasks/v1/lists/@default/tasks";
  reqURL += "?showDeleted=false";
  reqURL += "&showHidden=false";
  reqURL += "&showCompleted=false";
  
  console.log(reqURL);
  var xhr = new XMLHttpRequest();
  
  xhr.responseType = 'json';
  xhr.open('GET', reqURL);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.send();
  
  xhr.onerror = function () {
    console.log("HTTP ERROR [TASK]:");
    console.log(this);
  };

  xhr.onload = function() {
    console.log("HTTP SUCCESS [TASK]:");
    console.log(this.response);
    
    eventManager.updateTaskData(this.response);
    if(eventManager.isReady()){
      sendData();
    }
  };
}

function fetchCalendarData(token){
  console.log("fetchCalendarData()");
    
  var reqURL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
	reqURL += "?calendarId=primary";
	reqURL += "&maxResults=200";
	reqURL += "&orderBy=startTime";
	reqURL += "&showDeleted=false";
	reqURL += "&singleEvents=true";
	reqURL += "&timeMin=" + moment.tz(EST).format(fullDateFormat);
	
  console.log(reqURL);
  var xhr = new XMLHttpRequest();

  xhr.responseType = 'json';
  xhr.open('GET', reqURL);
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
	xhr.send();
  
  xhr.onerror = function () {
    console.log("HTTP ERROR [CAL]:");
    console.log(this);
  };

  xhr.onload = function() {
    console.log("HTTP SUCCESS [CAL]:");
    console.log(this.response);
    
    eventManager.updateCalendarData(this.response);
    if(eventManager.isReady()){
      sendData();
    }
  };
}

function sendData(){
  console.log("sendData(): GO!");
  chrome.extension.sendRequest(
  { msg: "event-data",
    data: eventManager.getEvents(),
    immediate: true
  });
}

function createEvent(eventInfo){
	console.log("createEvent('" + eventInfo + "')");
	eventManager.createEvent(eventInfo);
	sendData();
}

function deleteEvent(eventId){
	console.log("deleteEvent(" + eventId + ")");
	eventManager.deleteEvent(eventId);
	sendData();
}
  
      

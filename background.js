var eventManager = new EventManager();

var authToken = null;

chrome.extension.onRequest.addListener(
	function(request, sender, sendResponse){
	console.log("background: received message " + request.type);
		if(request.type === DATA_REQUEST){
			// DATA_REQUEST: send event data to the popup
			sendData();

		} else if(request.type === REFRESH_DATA){
			// REFRESH_DATA: retrieve data from google and update the popup
			getAuthorization(true);

		} else if(request.type === CREATE_EVENT){
			// CREATE_EVENT: create the event/task and send it to google calendar
			eventManager.createEvent(request.data);
			sendData();
			
		} else if(request.type === DELETE_EVENT){
			// DELETE_EVENT: deletes the event/task from google calendar
			eventManager.deleteEvent(request.data);
			sendData();
		}
	}
);

function getAuthorization(interactive){
  console.log("background: getAuthorization()");
  chrome.identity.getAuthToken({ 'interactive': interactive }, authorizationCallback);
}

function authorizationCallback(token) {
  console.log("background: authorizationCallback()");

	authToken = token;
	eventManager.setAuthToken(token);

  if (token) {
    eventManager.reset();

		api_getTasks(token, function(data){
			eventManager.updateTaskData(data);
			if(eventManager.isReady()){
				sendData();
			}
		});

		api_getCalendarEvents(token, function(data){
			eventManager.updateCalendarData(data);
			if(eventManager.isReady()){
				sendData();
			}
		});
  } else {
    chrome.extension.sendRequest({ type: AUTH_FAILURE });
  }
}

function loadData(){
  console.log("background: loadData()");
  
  if(!eventManager.isReady()){
    getAuthorization(false);
  } else {
    sendData();
  }
}

function sendData(){
	chrome.extension.sendRequest(
		{ type: EVENT_DATA, data: eventManager.getEvents() });
}

loadData();

var eventManager = new EventManager();

var authToken = null;

chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse){
	console.log("background: received message " + message.type);
		if(message.type === DATA_REQUEST){
			// DATA_REQUEST: send event data to the popup
			sendData();

		} else if(message.type === REFRESH_DATA){
			// REFRESH_DATA: retrieve data from google and update the popup
			getAuthorization(true);

		} else if(message.type === CREATE_EVENT){
			// CREATE_EVENT: create the event/task and send it to google calendar
			eventManager.createEvent(message.data);
			sendData();
			
		} else if(message.type === DELETE_EVENT){
			// DELETE_EVENT: deletes the event/task from google calendar
			eventManager.deleteEvent(message.data);
			sendData();

		} else if(message.type === TEST_DATA_REQUEST){
      addTestData();
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
    chrome.extension.sendMessage({ type: AUTH_FAILURE });
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
	chrome.extension.sendMessage(
		{ type: EVENT_DATA, data: eventManager.getEvents(), timeZone: curTZ() });
}
var added = false;
function addTestData(){
	if(added){
		return;
	}
	added = true;
  eventManager.createEvent("todo: Pickup drycleaning");
  eventManager.createEvent("todo: Call parents");
  eventManager.createEvent("due Nov 11: Phone Bill");
  eventManager.createEvent("due Nov 12: Quarterly Presentation");
  eventManager.createEvent("due Nov 22: ");
  eventManager.createEvent("Nov 11: Anne's Brithday");
  eventManager.createEvent("Dec 25: CHRISTMAS");
  eventManager.createEvent("Nov 9-14: Work Trip to Chicago");
  eventManager.createEvent("Nov 19-20: Parents visit");
  eventManager.createEvent("Nov 30-2: Thanksgiving Vacation");
  eventManager.createEvent("Nov 11 @20-22: Barbeque");
  eventManager.createEvent("Nov 14 @18: Dinner with Ben");

  eventManager.sortEvents();
}

//loadData();


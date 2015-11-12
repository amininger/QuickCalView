var localData = null;

// Receives a message from the background process
chrome.extension.onMessage.addListener(
	function(message, sender, sendResponse){
		console.log("popup: received message " + message.type);
		if(message.type === AUTH_FAILURE){
			showAuthDiv();
		} else if(message.type === EVENT_DATA){
			showContentDiv();
			populateData(message.data, message.timeZone);
		}
	}
);

// Called when the popup is loaded
function onPopupLoad(){
  console.log("popup: onPopupLoad()");
 
  addButtonListeners();
  showAuthDiv();
  showContentDiv();
  onShowHelpLinkClick(null);
   
  //chrome.extension.sendMessage({ type: DATA_REQUEST });
  chrome.extension.sendMessage({ type: TEST_DATA_REQUEST });
}

//========================================
// Switch between displaying the two divs
//========================================

// showAuthDiv
//   Shows the div with an authorization button
function showAuthDiv(){
  console.log("popup: showAuthDiv()");
  
  var authDiv = document.getElementById('authorize-div');
  authDiv.style.display = 'inline';
    
  var contentDiv = document.getElementById('content-div');
  contentDiv.style.display = 'none';
}

// showContentDiv
//   Shows the div with the event information
function showContentDiv(){
  console.log("popup: showContentDiv()");
  
  var authDiv = document.getElementById('authorize-div');
  authDiv.style.display = 'none';
    
  var contentDiv = document.getElementById('content-div');
  contentDiv.style.display = 'inline';
}

//========================================
// Button Event Handlers
//========================================

function addButtonListeners(){
  console.log("popup: addButtonListeners()");
  
  var authButton = document.getElementById('authorize-button');
  authButton.addEventListener("click", onAuthorizeClick);
  
  var refreshButton = document.getElementById('refresh-button');
  refreshButton.addEventListener("click", onRefreshClick);
  
  var createEventButton = document.getElementById('create-event-button');
  createEventButton.addEventListener("click", onCreateEventClick);

	var createEventText = document.getElementById('create-event-text');
	createEventText.addEventListener("keypress", onCreateEventKeypress);

	var calendarLink = document.getElementById('calendar-link');
	calendarLink.addEventListener("click", onCalendarLinkClick);
	
	var showHelpLink = document.getElementById('show-help-link');
	showHelpLink.addEventListener("click", onShowHelpLinkClick);
}

// onAuthorizeClick(e)
//   Send an authorization request to the background process
function onAuthorizeClick(event){
  console.log("popup: onAuthorizeClick()");
  
  chrome.extension.sendMessage({ type: REFRESH_DATA });
  return false;
}

// onRefreshClick(e)
//   Tells the background process to refresh the data
function onRefreshClick(event){
  console.log("popup: onRefreshClick()");

  chrome.extension.sendMessage({ type: REFRESH_DATA });
  return false;
}

// onCreateEventClick
//   Grabs the text in the create-event-text field and 
//     sends it to the background process to create an event
function onCreateEventClick(event){
  console.log("popup: onCreateEventClick()");

	var createEventText = document.getElementById("create-event-text");
	var eventInfo = createEventText.value;
	createEventText.value = "";

  chrome.extension.sendMessage({ type: CREATE_EVENT, data: eventInfo });
	return false;
}

// onCreateEventKeypress
//   If enter is pressed, grab the text in the create-event-text field
//     and send it to the background process
function onCreateEventKeypress(event){
	console.log(event.keyCode);
	if(event.keyCode === 13){
		console.log("popup: onCreateEventKeypress()");

		var createEventText = document.getElementById("create-event-text");
		var eventInfo = createEventText.value;
		createEventText.value = "";

		chrome.extension.sendMessage({ type: CREATE_EVENT, data: eventInfo });
	}
	return false;
}

function onCalendarLinkClick(event){
	chrome.tabs.create({ url: "https://www.google.com/calendar", active: true });
}

var showHelp = true;
function onShowHelpLinkClick(event){
	showHelp = !showHelp;
	var helpDiv = document.getElementById('help-div');
	var eventListDiv = document.getElementById('event-list-div');
	var showHelpLink = document.getElementById('show-help-link');
	
	if(showHelp){
		showHelpLink.innerHTML = "Hide Create Event Help";
		helpDiv.style.display = 'block';
		eventListDiv.style.display = 'none';
	} else {
		showHelpLink.innerHTML = "Show Create Event Help";
		helpDiv.style.display = 'none';
		eventListDiv.style.display = 'block';
	}
}



//========================================
// Display the events in the popup
//========================================
function createDividerDiv(title){
	var dividerDiv = document.createElement("div");
	dividerDiv.className = "divider-div";
	dividerDiv.appendChild(document.createTextNode(title));
	return dividerDiv;
}

function createEventDiv(e){
	var elementMap = new Object();
	elementMap.topDiv = document.createElement("div");
	elementMap.topDiv.className = "event-container-div";
	
	elementMap.table = document.createElement("table");
	elementMap.table.className = "event-table";
	
	elementMap.row = document.createElement("tr");
	elementMap.row.className = "event-table-row";
	
	elementMap.colorCol = document.createElement("td");
	elementMap.colorCol.className = "event-color-col";
	
	elementMap.labelCol = document.createElement("td");
	elementMap.labelCol.className = "event-label-col";
	
	elementMap.infoCol = document.createElement("td");
	elementMap.infoCol.className = "event-info-col";
	
	elementMap.textDiv = document.createElement("div");
	elementMap.textDiv.className = "event-text-div";
	
	elementMap.timeDiv = document.createElement("div");
	elementMap.timeDiv.className = "event-time-div";
	
	elementMap.deleteCol = document.createElement("td");
	elementMap.deleteCol.className = "event-delete-col";
	
	var delButton = document.createElement("input");
	delButton.type = "image";
	delButton.className = "delete-button";
	delButton.src = "delete_gray.png";
	delButton.alt = "X";
	delButton.data = e;
	delButton.addEventListener("click", function(e){
		chrome.extension.sendMessage({ type: "delete-event", data: e.target.data.id });
	});
	elementMap.deleteCol.appendChild(delButton);
	
	elementMap.topDiv.appendChild(elementMap.table);
	elementMap.table.appendChild(elementMap.row);
	elementMap.row.appendChild(elementMap.colorCol);
	elementMap.row.appendChild(elementMap.labelCol);
	elementMap.row.appendChild(elementMap.infoCol);
	elementMap.row.appendChild(elementMap.deleteCol);
	elementMap.infoCol.appendChild(elementMap.textDiv);
	elementMap.infoCol.appendChild(elementMap.timeDiv);
	
	return elementMap;
}

function createToDoEventDiv(e){
    var todoDivElements = createEventDiv(e);
	todoDivElements.labelCol.appendChild(document.createTextNode("TODO"));
	todoDivElements.infoCol.removeChild(todoDivElements.timeDiv);
	todoDivElements.textDiv.className = "todo-event-text-div";
	var colon = e.stringRep.indexOf(":");
	todoDivElements.textDiv.appendChild(document.createTextNode(e.stringRep.substring(colon+2)));
	
	return todoDivElements.topDiv;
}

function createTodayEventDiv(e){
    var todayDivElements = createEventDiv(e);
	var colon = e.stringRep.indexOf(":");
	var start = moment.tz(e.sortTime, curTZ());
	if(e.eventType === TASK){
		todayDivElements.labelCol.appendChild(document.createTextNode("DUE"));
	} else if(start.hour() == 0){
		todayDivElements.labelCol.appendChild(document.createTextNode("NOW"));
	} else {
		todayDivElements.labelCol.appendChild(document.createTextNode(start.format("h:mm")));
	}

	todayDivElements.textDiv.appendChild(document.createTextNode(e.stringRep.substring(colon+2)));
	todayDivElements.timeDiv.appendChild(document.createTextNode(e.stringRep.substring(0, colon)));
	
	return todayDivElements.topDiv;
}

function createWeekEventDiv(e){
    var weekDivElements = createEventDiv(e);
	var start = moment.tz(e.sortTime, curTZ());
	weekDivElements.labelCol.appendChild(document.createTextNode(getDOW(start)));
	var colon = e.stringRep.indexOf(":");
	weekDivElements.textDiv.appendChild(document.createTextNode(e.stringRep.substring(colon+2)));
	weekDivElements.timeDiv.appendChild(document.createTextNode(e.stringRep.substring(0, colon)));
	
	return weekDivElements.topDiv;
}

function createOtherEventDiv(e){
    var otherDivElements = createEventDiv(e);
	var start = moment.tz(e.sortTime, curTZ());
	otherDivElements.labelCol.appendChild(document.createTextNode(start.format("M/DD")));
	var colon = e.stringRep.indexOf(":");
	otherDivElements.textDiv.appendChild(document.createTextNode(e.stringRep.substring(colon+2)));
	otherDivElements.timeDiv.appendChild(document.createTextNode(e.stringRep.substring(0, colon)));
	
	return otherDivElements.topDiv;
}

function populateData(data, timeZone){
  console.log("popup: populateData()");
  console.log(data);

	var infoDiv = document.getElementById('timezone-div');
	infoDiv.innerHTML = "&nbspTimeZone: " + timeZone;
  
  var eventListDiv = document.getElementById('event-list-div');
  
  // Clear previoud data
  while (eventListDiv.firstChild) {
    eventListDiv.removeChild(eventListDiv.firstChild);
  }

  var today = moment.tz(curTZ()).startOf('day').add(1, "day");
  var week = moment.tz(curTZ()).startOf('day').add(7, "day");

  // Add new data
  data.forEach(function(d){
	if(d.stringRep.toLowerCase().startsWith("todo")){
      d.itemType = TODO_SECTION;
    } else if(moment.tz(d.sortTime, curTZ()).isBefore(today)){
      d.itemType = TODAY_SECTION;
    } else if(moment.tz(d.sortTime, curTZ()).isBefore(week)){
      d.itemType = WEEK_SECTION;
    } else {
      d.itemType = OTHERS_SECTION;
    }
  });
  
  // Todo Events
  eventListDiv.appendChild(createDividerDiv(TODO_SECTION));
  data.forEach(function(e){
	  if(e.itemType === TODO_SECTION){
		eventListDiv.appendChild(createToDoEventDiv(e));
	  }
  });
  
  // Events that happen today
  eventListDiv.appendChild(createDividerDiv(TODAY_SECTION));
  // First due tasks
  data.forEach(function(e){
	  if(e.itemType === TODAY_SECTION && e.eventType === TASK){
		eventListDiv.appendChild(createTodayEventDiv(e));
	  }
  });
  // Then events
  data.forEach(function(e){
	  if(e.itemType === TODAY_SECTION && e.eventType !== TASK){
		eventListDiv.appendChild(createTodayEventDiv(e));
	  }
  });
  
  // Events that happen this week
  eventListDiv.appendChild(createDividerDiv(WEEK_SECTION));
  data.forEach(function(e){
	  if(e.itemType === WEEK_SECTION){
		eventListDiv.appendChild(createWeekEventDiv(e));
	  }
  });
  
  // Other future events
  eventListDiv.appendChild(createDividerDiv(OTHERS_SECTION));
  data.forEach(function(e){
	  if(e.itemType === OTHERS_SECTION){
		eventListDiv.appendChild(createOtherEventDiv(e));
	  }
  });
}


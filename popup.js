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
   
  chrome.extension.sendMessage({ type: DATA_REQUEST });
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

//========================================
// Display the events in the popup
//========================================
function populateData(data, timeZone){
  console.log("popup: populateData()");
  console.log(data);

	var infoDiv = document.getElementById('info-div');
	infoDiv.innerHTML = "&nbspTimeZone: " + timeZone;
  
  var eventListDiv = document.getElementById('event-list-div');
  
  // Clear previoud data
  while (eventListDiv.firstChild) {
    eventListDiv.removeChild(eventListDiv.firstChild);
  }
  
	var i = 0;
  // Add new data
  data.forEach(function(d){
    var newDiv = document.createElement("div");
		newDiv.className = "event-div";
		newDiv.style.backgroundColor = (i%2==0 ? "#0288D1" : "#03A9F4");

		// BEGIN: leftDiv
		var leftDiv = document.createElement("div");
		leftDiv.className = "left-div";

		var textNode = document.createTextNode(d.stringRep + "\n");
		leftDiv.appendChild(textNode);

		newDiv.appendChild(leftDiv);
		// END: leftDiv

		// BEGIN: rightDiv
		var rightDiv = document.createElement("div");
		rightDiv.className = "right-div";

		var delButton = document.createElement("input");
		delButton.type = "image";
		delButton.className = "delete-button";
		delButton.src = "delete.png";
		delButton.alt = "X";
		delButton.data = d;
		delButton.addEventListener("click", function(e){
			chrome.extension.sendMessage({ type: "delete-event", data: e.target.data.id });
		});
		rightDiv.appendChild(delButton);

		newDiv.appendChild(rightDiv);
		// END: rightDiv

    eventListDiv.appendChild(newDiv);

		i++;
  });
}


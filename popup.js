var localData = null;

chrome.extension.onRequest.addListener(
    function(request, sender, sendResponse){
      if(request.msg === "authorization-failure"){
        showAuthDiv();
      } else if(request.msg === "event-data"){
        console.log("GOT DATA");
        console.log(request.immediate);
        showContentDiv();
        populateData(request.data);
      }
    }
);

function onPopupLoad(){
  console.log("onPopupLoad()");
 
  addButtonListeners();
  showAuthDiv();
   
  chrome.extension.sendRequest(
  { msg: "data-request"
  });
}

function addButtonListeners(){
  console.log("addButtonListeners()");
  
  var authButton = document.getElementById('authorize-button');
  authButton.addEventListener("click", onAuthorizeClick);
  
  var refreshButton = document.getElementById('refresh-button');
  refreshButton.addEventListener("click", onRefreshClick);
  
  var createEventButton = document.getElementById('create-event-button');
  createEventButton.addEventListener("click", onCreateEventClick);
}

function showAuthDiv(){
  console.log("showAuthDiv()");
  
  var authDiv = document.getElementById('authorize-div');
  authDiv.style.display = 'inline';
    
  var contentDiv = document.getElementById('content-div');
  contentDiv.style.display = 'none';
}

function showContentDiv(){
  console.log("showContentDiv()");
  
  var authDiv = document.getElementById('authorize-div');
  authDiv.style.display = 'none';
    
  var contentDiv = document.getElementById('content-div');
  contentDiv.style.display = 'inline';
}

function populateData(data){
  console.log("populateData");
  console.log(data);
  
  var eventListDiv = document.getElementById('event-list-div');
  
  // Clear previoud data
  while (eventListDiv.firstChild) {
    eventListDiv.removeChild(eventListDiv.firstChild);
  }
  
	var i = 0;
  // Add new data
  data.forEach(function(d){
    console.log(d);
    var newDiv = document.createElement("div");
		newDiv.className = "event-div";
		newDiv.style.backgroundColor = (i%2==0 ? "#8888FF" : "#5555FF");

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

		var delButton = document.createElement("button");
		delButton.className = "delete-button";
		delButton.innerHTML = "X";
		delButton.data = d;
		delButton.addEventListener("click", function(e){
			chrome.extension.sendRequest(
			{ msg: "delete-event",
				eventId: e.target.data.id
			});
		});
		rightDiv.appendChild(delButton);

		newDiv.appendChild(rightDiv);
		// END: rightDiv

    eventListDiv.appendChild(newDiv);

		i++;
  });
}

function onRefreshClick(event){
  console.log("onRefreshClick()");
  console.log(event);
  
  chrome.extension.sendRequest(
  { msg: "refresh-data"
  });
  return false;
}

function onCreateEventClick(event){
  console.log("onCreateEventClick()");
  console.log(event);

	var createEventText = document.getElementById("create-event-text");
	var eventInfo = createEventText.value;

  chrome.extension.sendRequest(
  { msg: "create-event",
		eventInfo: eventInfo
  });

	createEventText = "";
	return false;
}

function onAuthorizeClick(event){
  console.log("onAuthorizeClick()");
  console.log(event);
  
  chrome.extension.sendRequest(
  { msg: "authorization-request"
  });
  return false;
}

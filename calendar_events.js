if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

var EventManager = function(){
  this.events = [];
  this.ready = false;
  this.taskData = null;
  this.calendarData = null;
  
  this.isReady = function(){
    return this.ready;
  };

	this.setAuthToken = function(token){
		this.authToken = token;
	};
  
  this.getEvents = function(){
    return this.events;
  };
  
  this.reset = function(){
    this.ready = false;
    this.events = [];
    this.taskData = null;
    this.calendarData = null;
  };
  
  this.updateTaskData = function(taskData){
    this.taskData = taskData;
    if(this.calendarData !== null){
      this.parseEvents();
    }
  };
  
  this.updateCalendarData = function(calendarData){
    this.calendarData = calendarData;
    if(this.taskData !== null){
      this.parseEvents();
    }
  };
  
	// Take the data returned from the api and create the 
	//   events to display in the popup
  this.parseEvents = function(){
		// Add each task
    this.taskData.items.forEach(function(task){
			this.events.push(new Task().fromObject(task));
    }.bind(this));
    
		// Add each calendar event
		//   If a recurring event, only accept the first instance
		event_ids = {};
    this.calendarData.items.forEach(function(event){
			if ("recurringEventId" in event){
				if (event.recurringEventId in event_ids){
					return;
				}
				event_ids[event.recurringEventId] = event.id;
			}
      if ('start' in event && 'end' in event){
        this.events.push(new CalendarEvent().fromObject(event));
      }
    }.bind(this));
    
    this.sortEvents();
    this.ready = true;
  };
  
	// Create the event from the given string
  this.createEvent = function(stringRep){
		console.log("EventManager::createEvent(" + stringRep + ")");
		var e = null;
		var colon = stringRep.indexOf(":");
		if(colon == -1){
			console.log("No colon");
			return;
		}
		var prefix = stringRep.substr(0, colon);
		console.log(prefix);
		
		// Tasks must start with 'todo: ' or 'due: '
		if(prefix.toLowerCase().startsWith("todo") 
				|| prefix.toLowerCase().startsWith("due")){
			e = new Task().fromString(stringRep);
		} else {
			e = new CalendarEvent().fromString(stringRep);
		}

		console.log("Created Event: " + e.toString());

		this.events.push(e);
		this.sortEvents();

		// Tell the google api to create the event
		if(e.getType() === TASK){
			api_postTask(this.authToken, e);
		} else {
			api_postCalendarEvent(this.authToken, e);
		}
  };

	// Delete the event with the given id
	this.deleteEvent = function(eventId){
		console.log("EventManager::deleteEvent(" + eventId + ")");
		var e = null;
		var i = 0;
		// Search for the event and delete it
		for(i = 0; i < this.events.length; i++){
			if(this.events[i].id == eventId){
				e = this.events[i];
				break;
			}
		}
		if(e == null){
			console.log("Event not found");
			return;
		}
		this.events.splice(i, 1);

		// Tell the google api to delete the event
		if(e.getType() === TASK){
			api_putTaskCompleted(this.authToken, e);
		} else {
			api_deleteCalendarEvent(this.authToken, e);
		}
	};
  
	// Sort all the events by their timestamps
  this.sortEvents = function(){
    this.events.forEach(function(e){
      e.calcSortKey();
    });
    this.events.sort(function(e1, e2){
      return e1.sortKey.localeCompare(e2.sortKey);
    });
  };
};

// Task - defines a task in the default task list
//   Can have a due date or not
var Task = function(){
  this.id = null;
  this.title = "";
	this.dueDate = null;
 
	// Create the task from a string representation
	// Format: 'todo: <description>'
	// Format: 'due MMM DD: <decription>'
  this.fromString = function(str){
		var colon = str.indexOf(":");
		if (str.toLowerCase().startsWith("due")){
			this.dueDate = moment(str.substring(4, colon), "MMM D");
			if(this.dueDate.isBefore(moment.tz(curTZ()))){
				this.dueDate.add(1, "years");
			}
		} else {
			this.dueDate = null;
		}

		this.title = str.substring(colon+2);
    
    this.stringRep = this.toString();
    return this;
  };
  
	// Create the task from the object returned by google api
  this.fromObject = function(obj){
    this.id = obj.id;
    this.title = obj.title;
		
		if("due" in obj){
    	this.dueDate = moment(obj.due);
		} else {
			this.dueDate = null;
		}

    this.stringRep = this.toString();
    return this;
  };
  
	// Generate a string representation of the task
  this.toString = function(){
		if(this.dueDate != null){
			return this.dueDate.format("MMM D") + " " + getDOW(this.dueDate) + ": " + this.title;
		} else {
			return "ToDo: " + this.title;
		}
  };

	// Return either TASK or CALENDAR_EVENT
	this.getType = function(){
		return TASK;
	}
  
	// Calculate a string to use when sorting the events (timestamp)
  this.calcSortKey = function(){
		if(this.dueDate != null){
			this.sortKey = this.dueDate.toISOString();
		} else {
			this.sortKey = moment.tz("2000-01-01", "America/New_York").toISOString();
		}
  };

	// Returns the object to use as the body of a HTTP POST used to create the task
	this.getCreateBody = function(){
		if(this.dueDate == null){
			return { title: this.title };
		} else {
			return { title: this.title, due: this.dueDate.format(fullDateFormat) };
		}
	};
};

// CalendarEvent - defines an event on the primary calendar
//   Can be a time range, a whole day, or multiple days
var CalendarEvent = function(){
  this.id = null;
  this.summary = "";
  
  this.start = moment.tz(curTZ());
  this.end = moment.tz(curTZ());
      
	// Create the calendar event from a string representation
	// Format: 'Sep 24: <description>' - Full day event
	// Format: 'Jun 31-2: <description>' - Multi-day event
	// Format: 'Apr 15 @16.15: <description>' - Hour long event at 4:15 PM
	// Format: 'Jan 12 @9-15: <description>' - Event from 9AM to 3PM
  this.fromString = function(str){
		var prefix = str.toUpperCase().substring(0, str.indexOf(":"));
		var dash = prefix.indexOf("-");
		var at = prefix.indexOf("@");

		var addEndDay = false;
		var addEndMonth = false;

		console.log(prefix);
		if(at != -1){
			// Event at a certain time 
			var startStr = prefix;
			if(dash != -1){
				startStr = prefix.substring(0, dash);
			}
			this.start = moment.tz(startStr, "MMM D @H.mm", curTZ());

			if(dash == -1){
				this.end = this.start.clone().add(1, "hours");
			} else {
				var endStr = prefix.substring(0, at) + prefix.substring(dash+1);
				this.end = moment.tz(endStr, "MMM D @H.mm", curTZ());
			}
		} else if(dash != -1){
			// Multi-day Event
			var month = prefix.substring(0, 4);
			var d1 = prefix.substring(4, dash);
			var d2 = prefix.substring(dash);
			this.start = moment.tz(month + d1, "MMM D", curTZ());
			this.end = moment.tz(month + d2, "MMM D", curTZ());
			if(this.start.date() > this.end.date()){
				this.end.add(1, "months");
			}
			this.end.add(1, "days");
		} else {
			// Single-day Event
			this.start = moment.tz(prefix, "MMM D", curTZ());
			this.end = this.start.clone().add(1, "days");
		}

		var now = moment.tz(curTZ());
		if(this.start.isBefore(now)){
			this.start.add(1, "years");
			this.end.add(1, "years");
		}

		this.summary = str.substring(str.indexOf(":") + 2);
    
    this.stringRep = this.toString();
    return this;
  };
  
	// Create the calendar event from the object returned by the google api
  this.fromObject = function(obj){
    this.id = obj.id;
    this.summary = obj.summary;

		if("date" in obj.start){
			this.start = moment.tz(obj.start.date, curTZ());
		} else {
			this.start = moment.tz(obj.start.dateTime, curTZ());
		}

		if("date" in obj.end){
			this.end = moment.tz(obj.end.date, curTZ());
		} else {
			this.end = moment.tz(obj.end.dateTime, curTZ());
		}
    
    this.stringRep = this.toString();
    return this;
  };
  
	// Generate a string representation of the event
  this.toString = function(){
    var str = this.start.format("MMM D");
		str += " " + getDOW(this.start);
		if(this.start.hour() == 0){
			var endDay = this.end.clone().subtract(1, "day");
			if(this.start.date() != endDay.date()){
				str += "-" + endDay.format("D")
			}
		} else {
			str += " @" + this.start.format("h");
			if(this.start.minute() > 0){
				str += ":" + this.start.format("mm");
			}
			if(!this.start.clone().add(1, "hour").isSame(this.end)){
				str += "-" + this.end.format("h");
				if(this.end.minute() > 0){
					str += ":" + this.end.format("mm");
				}
			}
		}
    str += ": " + this.summary;
    return str;
  };

	// Returns either TASK or CALENDAR_EVENT
	this.getType = function(){
		return CALENDAR_EVENT;
	}
  
	// Calculate a string to use when sorting the events (timestamp)
  this.calcSortKey = function(){
    this.sortKey = this.start.toISOString();
  };

	// Returns an object used in the body of an HTTP POST when creating
	this.getCreateBody = function(){
		if(this.start.hour() == 0){
			return {
				summary: this.summary,
				start: toDate(this.start),
				end: toDate(this.end)
			};
		} else {
			return {
				summary: this.summary,
				start: toDateTime(this.start),
				end: toDateTime(this.end)
			};
		}
	};
};


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
  
  this.parseEvents = function(){
    console.log("TASKS");
    this.taskData.items.forEach(function(task){
			this.events.push(new Task().fromObject(task));
    }.bind(this));
    
    console.log("EVENTS");
		event_ids = {};
    this.calendarData.items.forEach(function(event){
			if ("recurringEventId" in event){
				console.log(event.recurringEventId);
				if (event.recurringEventId in event_ids){
					return;
				}
				event_ids[event.recurringEventId] = event.id;
			}
      if ('start' in event && 'end' in event){
        this.events.push(new CalEvent().fromObject(event));
      }
    }.bind(this));
    
    this.sortEvents();
    this.ready = true;
  };
  
  this.createEvent = function(stringRep){
		var e = null;
		var colon = stringRep.indexOf(":");
		if(colon == -1){
			console.log("No colon");
			return;
		}
		var prefix = stringRep.substr(0, colon);
		console.log(prefix);
		if(prefix.toLowerCase().startsWith("todo") || prefix.toLowerCase().startsWith("due")){
			e = new Task().fromString(stringRep);
		} else {
			e = new CalEvent().fromString(stringRep);
		}

		console.log(e.toString());

		this.events.push(e);
		this.sortEvents();

		if(e.getType() == "task"){
			api_postTask(this.authToken, e);
		} else {
			api_postCalendarEvent(this.authToken, e);
		}
  };

	this.deleteEvent = function(eventId){
		var e = null;
		var i = 0;
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

		if(e.getType() == "task"){
			api_putTaskCompleted(this.authToken, e);
		} else {
			api_deleteCalendarEvent(this.authToken, e);
		}
	};
  
  this.sortEvents = function(){
    this.events.forEach(function(e){
      e.calcSortKey();
    });
    this.events.sort(function(e1, e2){
      return e1.sortKey.localeCompare(e2.sortKey);
    });
  };
};

var Task = function(){
  this.id = null;
  this.title = "";
	this.dueDate = null;
  
  this.fromString = function(str){
		var colon = str.indexOf(":");
		if (str.toLowerCase().startsWith("due")){
			this.dueDate = moment(str.substring(4, colon), "MMM D");
			if(this.dueDate.isBefore(moment.tz(EST))){
				this.dueDate.add(1, "years");
			}
		} else {
			this.dueDate = null;
		}

		this.title = str.substring(colon+2);
    
    this.stringRep = this.toString();
    return this;
  };
  
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
  
  this.toString = function(){
		if(this.dueDate != null){
			return this.dueDate.format("MMM D") + " " + getDOW(this.dueDate) + ": " + this.title;
		} else {
			return "ToDo: " + this.title;
		}
  };

	this.getType = function(){
		return "task";
	}
  
  this.calcSortKey = function(){
		if(this.dueDate != null){
			this.sortKey = this.dueDate.toISOString();
		} else {
			this.sortKey = defaultDateTime.toISOString();
		}
  };

	this.getCreateBody = function(){
		if(this.dueDate == null){
			return { title: this.title };
		} else {
			return { title: this.title, due: toDate(this.dueDate) };
		}
	};
};

var CalEvent = function(){
  this.id = null;
  this.summary = "";
  
  this.start = defaultDateTime;
  this.end = defaultDateTime;
      
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
			this.start = moment.tz(startStr, "MMM D @H.mm", EST);

			if(dash == -1){
				this.end = this.start.clone().add(1, "hours");
			} else {
				var endStr = prefix.substring(0, at) + prefix.substring(dash+1);
				this.end = moment.tz(endStr, "MMM D @H.mm", EST);
			}
		} else if(dash != -1){
			// Multi-day Event
			var month = prefix.substring(0, 4);
			var d1 = prefix.substring(4, dash);
			var d2 = prefix.substring(dash);
			this.start = moment.tz(month + d1, "MMM D", EST);
			this.end = moment.tz(month + d2, "MMM D", EST);
			if(this.start.date() > this.end.date()){
				this.end.add(1, "months");
			}
			this.end.add(1, "days");
		} else {
			// Single-day Event
			this.start = moment.tz(prefix, "MMM D", EST);
			this.end = this.start.clone().add(1, "days");
		}

		var now = moment.tz(EST);
		if(this.start.isBefore(now)){
			this.start.add(1, "years");
			this.end.add(1, "years");
		}

		this.summary = str.substring(str.indexOf(":") + 2);
    
    this.stringRep = this.toString();
    return this;
  };
  
  this.fromObject = function(obj){
    this.id = obj.id;
    this.summary = obj.summary;

		if("date" in obj.start){
			this.start = moment.tz(obj.start.date, EST);
		} else {
			this.start = moment.tz(obj.start.dateTime, EST);
		}

		if("date" in obj.end){
			this.end = moment.tz(obj.end.date, EST);
		} else {
			this.end = moment.tz(obj.end.dateTime, EST);
		}
    
    this.stringRep = this.toString();
    return this;
  };
  
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

	this.getType = function(){
		return "event";
	}
  
  this.calcSortKey = function(){
    this.sortKey = this.start.toISOString();
  };

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

function test(str){
	var e = new CalEvent().fromString(str);
	e.calcSortKey();
	console.log(e.toString());
}

//test("Sep 1: stuff");
//test("Sep 1-4: stuff");
//test("Sep 30-4: stuff");
//test("Sep 30 @4: stuff");
//test("Sep 30 @4.15: stuff");
//test("Sep 30 @16-20: stuff");
//test("Sep 30 @16.30-20: stuff");
//test("Sep 30 @16-20.30: stuff");
//test("Sep 30 @16.15-20.30: stuff");

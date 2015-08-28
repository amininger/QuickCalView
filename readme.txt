QuickCalView Chrome Extension

This is a simple chrome extension I created to provide a quick view of upcoming calendar events + tasks, and to create new ones. This is for personal use, so it is not intended for wide use. It assumes the user is in the eastern time zone. 

There are 4 types of items this works with:

1. Todo Tasks

These are tasks on the default list with no specific due date.

Format: 'todo: <description>'

Example: 'todo: buy more paper towels'


2. Due Tasks

These are tasks on the default list with a specific due date.

Format: 'due MMM DD: <description>'

Example: 'due sep 3: research paper'


3. Calendar Events at a single time

These are events on the primary calendar that happen at a specific date and time. 

Format: 'MMM DD @HH.MM-HH.MM: <description>'
  Hours are in 24 hour format
	Time can be shortened to '@HH', '@HH-HH', '@HH.MM'
	If only a single time is given, the length is assumed to be 1 hour

Example: 'Jun 4 @15: Work Meeting'
Example: 'Dec 31 @8.30: Work Meeting'
Example: 'Apr 3 @12-14: Work Meeting'
Example: 'Mar 24 @8.30-15.15: Work Meeting'


4. Full Day Calendar Events

These are events on the primary calendar that last for 1+ days

Format: 'MMM DD: <description>' or 'MMM DD-DD: <description>'

Example: 'Jun 29: Richard's birthday'
Example: 'Jun 29-2: Summer Vacation' 
	# Here it automatically knows to go to July 2


Thanks to the following:

Moment:
moment.js and moment.tz.js libraries, 
freely provided under MIT license

Icon: 
Thanks to paomedia (iconfinder.com/paomedia)
Used under Creative Commons License Attribution 3.0 Unported
[creativecommons.org/licenses/by/3.0]


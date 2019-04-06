// Copyright 2015-2017 Simon Rawles, Alan Davies, Tim Hutton, Steve
// Horsley, Alistair Cree, Peter Fagan, David Hall, Adam Dawes,
// Robert O'Donnell.
//
// The JavaScript code in this page is free software: you can
// redistribute it and/or modify it under the terms of the GNU
// General Public License (GNU GPL) as published by the Free Software
// Foundation, either version 3 of the License, or (at your option)
// any later version.  The code is distributed WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
//
// As additional permission under GNU GPL version 3 section 7, you
// may distribute non-source (e.g., minimized or compacted) forms of
// that code without the copy of the GNU GPL normally required by
// section 4, provided you include this license notice and a URL
// through which recipients can access the Corresponding Source.

// Modified 2017/04/12 By Rob O'Donnell as part of Retrochallenge 2017/04
// to make the Editor's displayfacilties useable by alternative applications,
// e.g. an updated version of Adam Dawes teletext viewer, without need for
// it being "mercilessly and messily hacked about" :-D.  And for the
// viewdata browser I need to do myself.


// Todo: Hex page numbers.
// Todo: add carouselIndex to hash

/**
 *
 * Teletext Viewer Wrapper
 *
 * You need to include teletext-editor.js too!
 *
 **/


/*
// As per uniquecodeandata, Viewer is called from onload with

     function init_frames() {
		  // Create a new viewer:
          var viewer = new Viewer();
          // Make it the active viewer so it receives keypresses:
          active_viewer = viewer;
          // Initialise the viewer, placing it in the canvas with HTML ID 'frame'.
          viewer.init_frame('frame');
          // Set the user page entry offset
          viewer._viewer_setuserpageoffset(3);
          // Set the time display offset and format
          viewer._viewer_settimeformat(32, 'h:m/s');
          // Load all pages from this html page
          viewer._viewer_loadpages();
       }
*/


function Viewer(){

	var editor = new Editor;
	editor.associated_viewer = this;
	if (active_editor == null) {
		active_editor = editor;
	}

////////////////////////////
///// VIEWER FUNCTIONS /////
////////////////////////////

var _viewer_loaded_pages = {};
var _viewer_loaded_pagenumbers = [];
var _viewer_activepagenumber = 0;
var _viewer_nextpos = 0;
var _viewer_newpagenumber = 0;
var _viewer_userpageoffset = 0;
var _viewer_timeoffset = 32;
var _viewer_timeformat = '';	// No format = time display disabled
var _viewer_timeupdaterunning = false;

//////
// VIEWER: Initialise the user page number display position
//////
this._viewer_setuserpageoffset = function(offset)
{
	if (offset < 0) offset = 0;
	if (offset > 36) offset = 36;
	_viewer_userpageoffset = offset;
}

//////
// VIEWER: Initialise the time display position and format
//////
this._viewer_settimeformat = function(offset, format)
{
	if (offset < 0) offset = 0;
	if (offset > 36) offset = 36;
	_viewer_timeoffset = offset;
	_viewer_timeformat= format;

	// Start the update timer if not already done
	if (!_viewer_timeupdaterunning)
	{
		_viewer_timeupdaterunning = true;
		setInterval(_viewer_showtime, 1000);
	}
}


//////
// VIEWER: load all teletext pages from the hyperlinks present on the web page
//////
this._viewer_loadpages = function()
{
	_viewer_loadfromwebpage();
}

//////
// VIEWER: load all teletext pages from the hyperlinks present on the web page
//////
var _viewer_loadfromwebpage = function()
{
	var links = document.getElementsByTagName("a");
	var firstpage;

	if( window.location.hash ) {
		pagenumber = window.location.hash.substring(1,4);
		if (parseInt(pagenumber)) {
			firstpage = pagenumber;
		}
	}


	for (var i=0, max=links.length; i < max; i++)
	{
		var pagecontent = links[i].href;
		var pagenumber = links[i].innerHTML;
		var data = links[i].dataset;
		// Does this look like it contains page content?
		if (parseInt(pagenumber) && pagecontent.indexOf('#') >= 0)
		{
			console.log("loading page "+pagenumber);
			// Strip the URL part so we get just the encoded content
			pagecontent = pagecontent.substring(pagecontent.indexOf('#'));
			//alert(pagenumber);

			//_viewer_loaded_pages.push({pagenumber: pagenumber, pagecontent: pagecontent});
			// Does this page number already exist?
			if (!_viewer_loaded_pages[pagenumber])
			{
				// No, so initialise it now
				_viewer_loaded_pages[pagenumber] = {carouselindex: 0, pagecontent: [], data:data};
			}
			// Add the page content
			_viewer_loaded_pages[pagenumber].pagecontent.push(pagecontent);

			// Add to the page numbers if not already present
			if (_viewer_loaded_pagenumbers.length == 0 || _viewer_loaded_pagenumbers[_viewer_loaded_pagenumbers.length-1] != pagenumber)
			{
				_viewer_loaded_pagenumbers.push(pagenumber);
			}

			// Remember the first page
			if (!firstpage) firstpage = pagenumber;
		}
	}

	// Navigate to the first page
	_viewer_activepagenumber = firstpage;
	// set in url
	window.location.hash = _viewer_activepagenumber;

	// Display the page
	_viewer_displayactivepage();
}

var _viewer_changepage = function() 
{

	// Reset the carousel
	_viewer_resetcarousel(_viewer_newpagenumber);
	// Load the selected page, if found
	var pagecontent = _viewer_getloadedpage(_viewer_newpagenumber);
	if (pagecontent != '')
	{
		// Remember which page we're on
		_viewer_activepagenumber = _viewer_newpagenumber;
		// set in url
		window.location.hash = _viewer_activepagenumber;
		// Show the page number
		_viewer_showpagenumber(_viewer_activepagenumber);
		// Show the page (delayed so that the page number appears immediately)
		setTimeout(_viewer_displayactivepage, 50);
	}
	else
	{
		console.log('page not found');
	}

	// reset input
	_viewer_nextpos = 0;
	_viewer_newpagenumber = 0;
}
//////
// VIEWER: Process keypress events
//////
this._viewer_keypress = function(code)
{
	curx = _viewer_nextpos;
	cury = 0;
	console.log(code);
	if ( code == 104 ) // h
	{
		console.log(_viewer_loaded_pages[_viewer_activepagenumber].data);
		_viewer_newpagenumber = _viewer_loaded_pages[_viewer_activepagenumber].data["red"];
		_viewer_changepage();
	}
	if ( code == 106 ) // j
	{
		console.log(_viewer_loaded_pages[_viewer_activepagenumber].data);
		_viewer_newpagenumber = _viewer_loaded_pages[_viewer_activepagenumber].data["green"];
		_viewer_changepage();
	}
	if ( code == 107 ) // k
	{
		console.log(_viewer_loaded_pages[_viewer_activepagenumber].data);
		_viewer_newpagenumber = _viewer_loaded_pages[_viewer_activepagenumber].data["yellow"];
		_viewer_changepage();
	}
	if ( code == 108 ) // l
	{
		console.log(_viewer_loaded_pages[_viewer_activepagenumber].data);
		_viewer_newpagenumber = _viewer_loaded_pages[_viewer_activepagenumber].data["blue"];
		_viewer_changepage();
	}
	if ( code == 109 ) // m
	{
		console.log(_viewer_loaded_pages[_viewer_activepagenumber].data);
		window.location.href = "https://edit.tf/"+_viewer_loaded_pages[_viewer_activepagenumber].pagecontent;
		_viewer_changepage();
	}

	if ( code >= 48 && code <= 57 ) // this is a numeric character...
	{
		// Add the digit to the page number
		_viewer_newpagenumber *= 10;
		_viewer_newpagenumber += (code - 48);

		// Display the page number
		_viewer_showpagenumber(_viewer_newpagenumber);

		_viewer_nextpos += 1;
		// Have we entered a full page number?
		if (_viewer_nextpos == 3)
		{
			_viewer_changepage();
		}
	}
	


}

//////
// VIEWER: Process keydown events
//////
this._viewer_keydown = function(code)
{
	// Previous/next carousel navigation
	if ( code == 37 || code == 39 )	// cursor left / right
	{
		// Move to the previous or next carousel page
		_viewer_changecarousel(_viewer_activepagenumber, (code == 37 ? -1 : 1));
		// Show the page
		_viewer_displayactivepage();
		// Reset page input
		_viewer_nextpos = 0;
		_viewer_newpagenumber = 0;
	}

	// Previous/next valid page navigation
	if(code == 38 || code == 40) // cursor up / down
	{
		// Move to the appropriate page
		_viewer_activepagenumber = _viewer_getadjacentpagenumber(_viewer_activepagenumber, (code == 38 ? 1 : -1));
		// set in url
		window.location.hash = _viewer_activepagenumber;
		// Reset the carousel
		_viewer_resetcarousel(_viewer_activepagenumber);
		// Show the page number
		_viewer_showpagenumber(_viewer_activepagenumber);
		// Show the page (delayed so that the page number appears immediately)
		setTimeout(_viewer_displayactivepage, 50);
		// Reset page input
		_viewer_nextpos = 0;
		_viewer_newpagenumber = 0;

	}
}

//////
// VIEWER: Display the active page
//////
var _viewer_displayactivepage = function()
{
	// Get the new page content
	var pagecontent = _viewer_getloadedpage(_viewer_activepagenumber);
	if (pagecontent != '')
	{
		// Clear
		editor.wipe();

		// Load the content
		editor.load(pagecontent);	// was load_from_hashstring.

		// Re-add the page number
		_viewer_showpagenumber(_viewer_activepagenumber);
		// Re-add the time
		_viewer_showtime();
		
		timer = _viewer_loaded_pages[_viewer_activepagenumber].data["timer"];
		if (timer) {
			window.setTimeout(function() {
				timer_target = _viewer_loaded_pages[_viewer_activepagenumber].data["timer_target"];
				if (timer_target) {
					_viewer_newpagenumber = timer_target;
					_viewer_changepage();
				}
			}, timer*1000);
		}

//		// Redraw everything   WHY?
//		editor.redraw();

		// Reset page input
		_viewer_nextpos = 0;
		_viewer_newpagenumber = 0;
	}
	else
	{
		alert('Page not found');
	}
}

//////
// VIEWER: Return one of the pages loaded from the web site.
//////
var _viewer_getloadedpage = function(pagenumber)
{
	// Does this page exist?
	var loadedpage = _viewer_loaded_pages[pagenumber.toString()];
	if (loadedpage)
	{
		// Yes, return the sub-page
		return loadedpage.pagecontent[loadedpage.carouselindex];
	}

	// Page not found
	return '';
}

//////
// VIEWER: Reset the carousel for the specified page back to the first sub-page
//////
var _viewer_resetcarousel = function(pagenumber)
{
	// Get the page, does it exist?
	var loadedpage = _viewer_loaded_pages[pagenumber.toString()];
	if (loadedpage)
	{
		// Yes, update the carousel
		loadedpage.carouselindex = 0;
	}
}

//////
// VIEWER: Move to the next or previous carousel sub-page for the specified page number
//////
var _viewer_changecarousel = function(pagenumber, offset)
{
	// Get the page, does it exist?
	var loadedpage = _viewer_loaded_pages[pagenumber.toString()];
	if (loadedpage)
	{
		// Yes, update the carousel
		loadedpage.carouselindex += offset;
		if (loadedpage.carouselindex < 0) loadedpage.carouselindex = loadedpage.pagecontent.length - 1;
		if (loadedpage.carouselindex >= loadedpage.pagecontent.length) loadedpage.carouselindex = 0;
	}
}

//////
// VIEWER: Determine and return the next or previous valid page number from the page number specified
//////
var _viewer_getadjacentpagenumber = function(pagenumber, offset)
{
	pagenumber = pagenumber.toString();
	// Wrap backwards?
	if (offset < 0 && _viewer_loaded_pagenumbers[0] == pagenumber) return _viewer_loaded_pagenumbers[_viewer_loaded_pagenumbers.length - 1];
	// Wrap forwards?
	if (offset > 0 && _viewer_loaded_pagenumbers[_viewer_loaded_pagenumbers.length - 1] == pagenumber) return _viewer_loaded_pagenumbers[0];
	// Find the page
	for (var i = 0; i < _viewer_loaded_pagenumbers.length; i++)
	{
		if (_viewer_loaded_pagenumbers[i] == pagenumber)
		{
			// Found it
			if (offset < 0) return _viewer_loaded_pagenumbers[i-1];
			return _viewer_loaded_pagenumbers[i+1];
		}
	}
	// Not found
	return _viewer_loaded_pagenumbers[0];
}

//////
// VIEWER: Display the active page number in the corner of the display
//////
var _viewer_showpagenumber = function(pagenumbertext)
{
	pagenumbertext = 'P' + pagenumbertext.toString() + '   ';

	// Add the page number text to the page
	for (var i = 0; i < 4; i++)
	{
		editor.setcc(0,i + _viewer_userpageoffset, pagenumbertext.charCodeAt(i));
	}
	// Re-render the page number area
	editor.render(_viewer_userpageoffset,0,4,1);
}

//////
// VIEWER: Display the time in the corner of the page
//////
var _viewer_showtime = function()
{
	var currentDate = new Date();
	//timetext = 'hh:mm/ss';
	//timetext = currentDate.getHours() + ':' + currentDate.getMinutes() + ':' + currentDate.getSeconds();
	timetext = '';
	for (var i = 0; i < _viewer_timeformat.length; i++)
	{
		var thischar = _viewer_timeformat.charAt(i);
		switch (thischar)
		{
			case 'h':
				timetext += ('0' + currentDate.getHours()).slice(-2);
				break;
			case 'm':
				timetext += ('0' + currentDate.getMinutes()).slice(-2);
				break;
			case 's':
				timetext += ('0' + currentDate.getSeconds()).slice(-2);
				break;
			default:
				timetext += thischar;
				break;
		}
	}

	// Add the page number text to the page
	for (var i = 0; i < timetext.length; i++)
	{
		if (i + _viewer_timeoffset < 40)
		{
			editor.setcc(0, i + _viewer_timeoffset, timetext.charCodeAt(i));
		}
	}
	// Re-render the page number area
	editor.render(_viewer_timeoffset,0,timetext.length,1);
}


this.init_frame = function(id) {
	editor.canvasid = id;

	// Set up the screen and render it.
	editor.init_state();
	editor.render(0, 0, 40, 25, 0);

	// Set up listeners for events
	//editor.init_mouse();
	document.onkeypress = this.keypress; //page_keypress;
	document.onkeydown = this.keydown; //page_keydown;
}

this.keypress = function(event) {
	var code = ( 'charCode' in event ) ? event.charCode : event.keyCode;

	// VIEWER: handle the keypress
	active_editor.associated_viewer._viewer_keypress(code);
	return;
}

this.keydown = function(event) {
	var code = ('which' in event) ? event.which : event.keyCode;

	// VIEWER: ignore keydown events
	active_editor.associated_viewer._viewer_keydown(code);
	return;
}



}

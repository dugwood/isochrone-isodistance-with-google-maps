var isochrone = {
	mapId: '',
	map: false,
	load: function (parameters)
	{
		if ((typeof parameters.map) === 'undefined')
		{
			console.log('Missing map parameter');
			return false;
		}
		this.mapId = parameters.map;
		if ((typeof parameters.key) !== 'undefined')
		{
			/* API's key provided => load the API */
			var s = document.createElement('script'), h = document.head;
			s.async = true;
			s.src = 'https://maps.googleapis.com/maps/api/js?key=' + parameters.key + '&callback=isochrone.init';
			h.appendChild(s);
		}
		else
		{
			/* API is already loaded, initializing */
			this.init();
		}
	},
	init: function ()
	{
		this.map = new google.maps.Map(document.getElementById(this.mapId), {
			zoom: 12,
			center: {lat: 48.8589507, lng: 2.2770205}
		});
	}
};

//
////var map = null;
//var geocoder = null;
//var directionsPanel = null;
//var directions = null;
//var inc_x = 0.01;
//var inc_y = 0.01;
//var x = 0.01;
//var y = 0.01;
//var m = 0;
//var intval = null;
//var slice = (2 * Math.PI) / 10;
//var start_s = 0;
//var prev_meas = 0;
//var prev_dest = null;
//var points = new Array();
//var found = 0;
//
//function initialize()
//{
//	if (GBrowserIsCompatible())
//	{
//		map = new GMap2(document.getElementById("map_canvas"));
//		map.setCenter(new GLatLng(37.4419, -122.1419), 13);
//		geocoder = new GClientGeocoder();
//		directionsPanel = document.getElementById("map_text");
//		directions = new GDirections(map, directionsPanel);
//	}
//}
//
//function crawlpoint(px, py, mins)
//{
//	var point = new GPoint(px, py);
//	var destpoint = new GPoint(px + x, py + y);
//
//	directions.loadFromWaypoints(new Array(point.y + "," + point.x, destpoint.y + "," + destpoint.x), {preserveViewport: true});
//	x = x + (inc_x * Math.sin(start_s));
//	y = y + (inc_y * Math.cos(start_s));
//	m = m + 1;
//
//	if (directions.getNumRoutes() > 0)
//	{
//		document.getElementById('txt1').value = 'y' + document.getElementById('txt1').value
//		var curr_meas = directions.getDuration().seconds / 60;
//		if (prev_meas <= mins && curr_meas > mins)
//		{
//			map.addOverlay(new GMarker(prev_dest, {title: 'Distance: ' + directions.getDuration().html}));
//			found = 1;
//		}
//		else
//		{
//			prev_dest = destpoint;
//			prev_meas = curr_meas;
//		}
//
//		if (curr_meas > (mins + (mins * 0.4)) || (m > 20 && found == 1) || m > 50)
//		{
//			points.push(new GLatLng(prev_dest.y, prev_dest.x));
//			start_s = start_s + slice;
//			x = inc_x;
//			y = inc_y;
//			m = 0;
//			found = 0;
//			prev_meas = 0;
//			curr_meas = 0;
//			prev_dest = point;
//			directions.clear();
//
//			if (start_s >= (2 * Math.PI))
//			{
//				start_s = 0;
//				//map.addOverlay(new GPolygon(points, "#f33f00", 5, 1, "#ff99aa", 0.2));
//				$('#loader').hide();
//				clearInterval(intval);
//			}
//		}
//
//
//	}
//	else
//	{
//		document.getElementById('txt1').value = 'n' + document.getElementById('txt1').value
//	}
//}
//
//function isocrona(address, minutes)
//{
//	if (geocoder)
//	{
//		geocoder.getLatLng(
//				address,
//				function (point)
//				{
//					if (!point)
//					{
//						alert(address + " not found");
//					}
//					else
//					{
//						map.setCenter(point, 10);
//						prev_dest = point;
//						$('#loader').show();
//						intval = setInterval("crawlpoint(" + point.x + "," + point.y + "," + minutes + ")", 3000);
//					}
//				}
//		);
//	}
//}
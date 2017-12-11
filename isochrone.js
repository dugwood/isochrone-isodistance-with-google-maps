var isochrone = {
	map: {
		id: '',
		map: false,
		zoom: 0,
		lat: 0,
		lng: 0
	},
	service: false,
	ready: false,
	debug: false,
	computation: {
		slices: 0,
		cycles: 0,
		lat: 0,
		lng: 0,
		time: 0,
		distance: 0,
		mode: '',
		system: '',
		callback: false,
		points: []
	},
	log: function (text)
	{
		if (this.debug)
		{
			console.log(text);
		}
	},
	load: function (parameters)
	{
		if ((typeof parameters.map) === 'undefined')
		{
			this.log('Missing map parameter');
			return false;
		}
		this.map.id = parameters.map;
		this.map.zoom = parameters.zoom || 14;
		this.map.lat = parameters.lat || 48.858254;
		this.map.lng = parameters.lng || 2.294563;
		this.debug = parameters.debug || false;
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
		this.map.map = new google.maps.Map(document.getElementById(this.map.id), {
			zoom: this.map.zoom,
			center: {
				lat: this.map.lat,
				lng: this.map.lng
			}
		});
		this.service = new google.maps.DistanceMatrixService();
		this.ready = true;
	},
	compute: function (parameters)
	{
		if (!this.ready)
		{
			this.log('Not ready, call init() or wait for init to be callbacked');
			return false;
		}
		this.computation.slices = parseInt(parameters.slices || 8);
		if (this.computation.slices < 2 || this.computation.slices > 25)
		{
			this.log('Wrong value for slices: between 2 and 25');
			return false;
		}
		this.computation.cycles = parseInt(parameters.cycles || 10);
		if (this.computation.cycles < 2 || this.computation.cycles > 50)
		{
			this.log('Wrong value for cycles: between 2 and 50');
			return false;
		}
		if (!parameters.lat || !parameters.lng)
		{
			this.log('Missing lat and lng parameters');
			return false;
		}
		this.computation.lat = parameters.lat;
		this.computation.lng = parameters.lng;
		if (!parameters.callback)
		{
			this.log('Missing callback');
			return false;
		}
		this.computation.callback = parameters.callback;
		if (!parameters.mode || !parameters.mode.match(/^(walking|bicycling|driving|transit)$/))
		{
			this.log('Missing mode or invalid mode');
			return false;
		}
		this.computation.mode = parameters.mode.toUpperCase();
		if (!parameters.time && !parameters.distance)
		{
			this.log('Missing either time or distance');
			return false;
		}
		this.computation.time = parseInt(parameters.time || 0);
		this.computation.distance = parseFloat(parameters.distance || 0);
		if (this.computation.time && this.computation.distance)
		{
			this.log('Both time and distance are set');
			return false;
		}
		this.computation.system = parameters.system && parameters.system === 'imperial' ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC;

		/* Cut the circle in «slices» */
		new google.maps.Marker({position: {lat: this.computation.lat, lng: this.computation.lng}, map: this.map.map});
		var radians,
				latitude,
				longitude,
				delta = 0.01,
				destinations = [];
		for (var s = 0; s < this.computation.slices; s++)
		{
			radians = 2 * Math.PI * s / this.computation.slices;
			latitude = this.computation.lat + delta * Math.cos(radians);
			longitude = this.computation.lng + delta * Math.sin(radians);
			new google.maps.Marker({position: {lat: latitude, lng: longitude}, map: this.map.map});
			destinations.push(new google.maps.LatLng(latitude, longitude));
		}
		this.service.getDistanceMatrix({
			origins: [new google.maps.LatLng(this.computation.lat, this.computation.lng)],
			destinations: destinations,
			travelMode: this.computation.mode,
			unitSystem: this.computation.system,
		}, function (data, result)
		{
			if (result === 'OK' && data && data.rows)
			{
				console.log(data.rows);
			}
		});
	},
	addPolygon: function (points)
	{

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
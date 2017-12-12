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
		cycle: 0,
		lat: 0,
		lng: 0,
		type: '',
		value: 0,
		mode: '',
		system: '',
		callback: false,
		positions: []
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
		this.computation.cycle = 0;
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
		if (!parameters.type || parameters.type !== 'duration' && parameters.type !== 'distance')
		{
			this.log('Missing type or invalid type');
			return false;
		}
		this.computation.type = parameters.type;
		this.computation.value = parseFloat(parameters.value || 0);
		if (!this.computation.value)
		{
			this.log('Wrong value (must be greater than zero');
			return false;
		}
		this.computation.system = parameters.system && parameters.system === 'imperial' ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC;

		/* Cut the circle in «slices» */
		new google.maps.Marker({position: {lat: this.computation.lat, lng: this.computation.lng}, map: this.map.map});
		this.computation.positions = [];
		for (var s = 0; s < this.computation.slices; s++)
		{
			this.computation.positions.push({
				radians: 2 * Math.PI * s / this.computation.slices,
				min: {
					delta: 0,
					value: 0
				},
				max: {
					delta: 0,
					value: 0
				},
				delta: 0.01,
				lat: 0,
				lng: 0,
				duration: 0,
				distance: 0,
				found: false
			});
		}
		this.cycle();
	},
	cycle: function ()
	{
		var computation = isochrone.computation;
		if (computation.cycle++ >= computation.cycles)
		{
			computation.callback(computation.positions);
			return false;
		}
		var p = 0, position, destinations = [];
		for (; p < computation.positions.length; p++)
		{
			position = computation.positions[p];
			if (!position.found)
			{
				position.lat = computation.lat + position.delta * Math.cos(position.radians);
				position.lng = computation.lng + position.delta * Math.sin(position.radians);
				//new google.maps.Marker({position: {lat: position.lat, lng: position.lng}, map: this.map.map});
				destinations.push(new google.maps.LatLng(position.lat, position.lng));
			}
		}
		this.service.getDistanceMatrix({
			origins: [new google.maps.LatLng(computation.lat, computation.lng)],
			destinations: destinations,
			travelMode: computation.mode,
			unitSystem: computation.system,
		}, function (data, result)
		{
			if (result !== 'OK' || (typeof data.rows[0].elements) === 'undefined')
			{
				computation.callback(computation.positions);
				return false;
			}
			for (var i = 0; i < data.rows[0].elements.length; i++)
			{
				var d = data.rows[0].elements[i], value = 0, position = computation.positions[i];
				if (d.status === 'OK')
				{
					value = parseFloat(d[computation.type].value);
					if (value < computation.value && // value is lower than expected
							(!position.min.delta || // no minimum for now
									position.delta > position.min.delta && value > position.min.value)) // value and delta are higher than minimum
					{
						position.min.delta = position.delta;
						position.min.value = value;
					}
					if (value > computation.value && // value is higher than expected
							(!position.max.delta || // no maximum for now
									position.delta < position.max.delta && value < position.max.value)) // value and delta are lower than maximum
					{
						position.max.delta = position.delta;
						position.max.value = value;
					}
					/* Perfect match */
					if (value === computation.value)
					{
						position.found = true;
					}
					else
					{
						/* Recompute delta */
						if (!position.min.delta)
						{
							/* Position is relative to the max found: apply «règle de trois» (Cross-multiplication) */
							position.delta = position.max.delta * computation.value / position.max.value;
						}
						else if (!position.max.delta)
						{
							/* Position is relative to the min found: apply «règle de trois» (Cross-multiplication) */
							position.delta = position.min.delta * computation.value / position.min.value;
						}
						else
						{
							/* Use mean between min and max */
							position.delta = (position.min.delta + position.max.delta) / 2;
						}
					}
				}
			}
			isochrone.cycle();
		}
		);
	},
	addPolygon: function (points)
	{
		points.push(points[0]); // close the line
		var zone = new google.maps.Polygon({path: points});
		zone.setMap(isochrone.map.map);
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
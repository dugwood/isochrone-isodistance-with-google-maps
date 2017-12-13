/*! Isochrone and isodistance drawer for Google Maps by www.dugwood.com */
var isochrone = {
	map: {
		id: '',
		map: false,
		zoom: 0,
		lat: 0,
		lng: 0
	},
	requests: 0,
	service: false,
	ready: false,
	callback: false,
	debug: false,
	computation: {
		errors: 0,
		slices: 0,
		cycles: 0,
		cycle: 0,
		lat: 0,
		lng: 0,
		type: '',
		value: 0,
		mode: '',
		system: '',
		precision: 0,
		callback: false,
		positions: []
	},
	radius: {// These are approximate values, so that the first point is not that far from the final value
		duration: {
			walking: 11,
			bicycling: 30,
			driving: 60,
			transit: 10
		},
		distance: {
			walking: 9,
			bicycling: 8,
			driving: 7,
			transit: 7
		}
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
		this.callback = parameters.callback || false;
		this.requests = parseFloat(parameters.requests || 2);
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
		if (this.callback)
		{
			this.callback(this);
		}
	},
	compute: function (parameters)
	{
		if (!parameters.callback)
		{
			this.computation.callback = function ()
			{};
			return this.computationCallback('KO', 'Missing callback');
		}
		this.computation.errors = 0;
		this.computation.callback = parameters.callback;
		if (!this.ready)
		{
			return this.computationCallback('KO', 'Not ready, call init() or wait for init to be callbacked');
		}
		this.computation.slices = parseInt(parameters.slices || 8);
		if (this.computation.slices < 4 || this.computation.slices > 25)
		{
			return this.computationCallback('KO', 'Wrong value for slices: between 2 and 25');
		}
		this.computation.cycle = 0;
		this.computation.cycles = parseInt(parameters.cycles || 10);
		if (this.computation.cycles < 2 || this.computation.cycles > 50)
		{
			return this.computationCallback('KO', 'Wrong value for cycles: between 2 and 50');
		}
		if (!parameters.lat || !parameters.lng)
		{
			return this.computationCallback('KO', 'Missing lat and lng parameters');
		}
		this.computation.lat = parameters.lat;
		this.computation.lng = parameters.lng;
		if (!parameters.mode || !parameters.mode.match(/^(walking|bicycling|driving|transit)$/))
		{
			return this.computationCallback('KO', 'Missing mode or invalid mode');
		}
		this.computation.mode = parameters.mode.toUpperCase();
		if (!parameters.type || parameters.type !== 'duration' && parameters.type !== 'distance')
		{
			return this.computationCallback('KO', 'Missing type or invalid type');
		}
		this.computation.type = parameters.type;
		this.computation.value = parseFloat(parameters.value || 0);
		if (!this.computation.value)
		{
			return this.computationCallback('KO', 'Wrong value (must be greater than zero');
		}
		this.computation.precision = parseInt(parameters.precision || 5) / 100;
		this.computation.system = parameters.system && parameters.system === 'imperial' ? google.maps.UnitSystem.IMPERIAL : google.maps.UnitSystem.METRIC;

		/* Cut the circle in «slices» */
		this.computation.positions = [];
		var radius = this.radius[this.computation.type][this.computation.mode] * this.computation.value / 1000000;
		if (this.computation.system === 'imperial')
		{
			radius *= 0.9144;
		}
		for (var s = 0; s < this.computation.slices; s++)
		{
			this.computation.positions.push({
				radians: 2 * Math.PI * s / this.computation.slices,
				min: {
					radius: 0,
					value: 0
				},
				max: {
					radius: 0,
					value: 0
				},
				/* Radius is really an approximate value */
				radius: 0.01,
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
			return isochrone.computationCallback('OK');
		}
		var p = 0, position, destinations = [], relations = [];
		for (; p < computation.positions.length; p++)
		{
			position = computation.positions[p];
			if (!position.found)
			{
				position.lat = computation.lat + position.radius * Math.cos(position.radians);
				position.lng = computation.lng + position.radius * Math.sin(position.radians);
				//new google.maps.Marker({position: {lat: position.lat, lng: position.lng}, label: '' + computation.cycle, map: isochrone.map.map});
				destinations.push(new google.maps.LatLng(position.lat, position.lng));
				relations.push(p);
			}
		}
		if (!destinations.length)
		{
			return isochrone.computationCallback('OK');
		}
		isochrone.service.getDistanceMatrix({
			origins: [new google.maps.LatLng(computation.lat, computation.lng)],
			destinations: destinations,
			travelMode: computation.mode,
			unitSystem: computation.system,
		}, function (data, result)
		{
			if (result !== 'OK')
			{
				if (result === 'OVER_QUOTA_LIMIT' && computation.errors++ <= 10)
				{
					computation.cycle--;
					isochrone.requests = Math.max(0.5, isochrone.requests - 0.5);
					setTimeout(isochrone.cycle, 2000);
					return false;
				}
				return isochrone.computationCallback(result);
			}
			if ((typeof data.rows[0].elements) === 'undefined' || data.rows[0].elements.length !== destinations.length)
			{
				return isochrone.computationCallback('LENGTH');
			}
			for (var i = 0; i < data.rows[0].elements.length; i++)
			{
				var d = data.rows[0].elements[i],
						value = 0,
						position = computation.positions[relations[i]],
						minWeight = 0,
						maxWeight = 0;
				if (d.status !== 'OK')
				{
					continue;
				}
				value = parseFloat(d[computation.type].value);
				if (value < computation.value && // value is lower than expected
						(!position.min.radius || // no minimum for now
								position.radius > position.min.radius && value > position.min.value)) // value and radius are higher than minimum
				{
					position.min.radius = position.radius;
					position.min.value = value;
				}
				if (value > computation.value && // value is higher than expected
						(!position.max.radius || // no maximum for now
								position.radius < position.max.radius && value < position.max.value)) // value and radius are lower than maximum
				{
					position.max.radius = position.radius;
					position.max.value = value;
				}
				/* Accepted match */
				if (Math.abs(value - computation.value) / computation.value < computation.precision)
				{
					position.found = true;
				}
				else
				{
					/* Recompute radius */
					if (!position.min.radius)
					{
						/* Position is relative to the max found: apply «règle de trois» (Cross-multiplication) */
						position.radius = position.max.radius * computation.value / position.max.value;
					}
					else if (!position.max.radius)
					{
						/* Position is relative to the min found: apply «règle de trois» (Cross-multiplication) */
						position.radius = position.min.radius * computation.value / position.min.value;
					}
					else
					{
						/* Use «moyenne pondérée» (weighted arithmetic mean) */
						/* weights are the difference between expected value and min/max values, inversed (less the distance is best) */
						minWeight = 1 / Math.abs(position.min.value - computation.value);
						maxWeight = 1 / Math.abs(position.max.value - computation.value);
						position.radius = (position.min.radius * minWeight + position.max.radius * maxWeight) / (minWeight + maxWeight);
					}
				}
			}
			setTimeout(isochrone.cycle, parseInt(1000 / isochrone.requests));
		});
	},
	computationCallback: function (status, message)
	{
		message = message || '';
		if (message)
		{
			isochrone.log(message);
		}
		var computation = isochrone.computation;
		if (computation.positions.length)
		{
			computation.positions.push(computation.positions[0]); // Close the polygon for easier drawing
		}
		computation.callback(status, computation.positions);
		return false;
	}
};
# Isochrone and Isodistance with Google Maps API

Inspired by https://github.com/sandropaganotti-zz/isochrone-with-google-map and https://github.com/lydonchandra/isochrone-with-google-map

Isochrone is a polygon representing how far you would go from a single point in every direction, following each road in a given timeframe. It's the best way to find out where you should live if you want to be «at most 5 minutes away from a tube station».
Isodistance is similar, but ignores duration taken for traveling. For example by car you would go faster on highways, but with isodistance highways and sidewalks are the same.

- isochrone (same duration) or isodistance (same distance) library
- polygon definition: number of slices, number of cycles to make the precision better
- export polygons' points for future use (avoid computing everything every time)

# Example
This is the isochrone of walking for 15 minutes from the Eiffel Tower in 16 directions:
![Eiffel Tower isochrone](https://www.dugwood.com/isochrone-screenshot.png?1520424890)

# Live Demo

https://isochrone.dugwood.com/index.html

# Documentation

## HTML Code
```html
<script type="text/javascript" src="isochrone.js"></script>
<div id="theMap"></div>
```

## Initialize
```javascript
isochrone.init({
	map: 'theMap',
	key: 'your-google-maps-api-key'
});
```
Parameters:
 - map: (string) the HTML ID of your map
 - key: (string) if not already loaded, please provide your Google Maps API key so that it's loaded automatically
 - zoom: (integer) if key is provided: default zoom of the map
 - lat: (float) if key is provided: default latitude of the map
 - lng: (float) if key is provided: default longitude of the map
 - requests: (float) number of requests per second to [Google Maps API](https://developers.google.com/maps/documentation/javascript/distancematrix#quotas): maximum is 100 elements/s, about 25 elements/request, up to 4 should be good (if you don't have multiple users!). Defaults to 2.
 - callback: (function) function launched when isochrone and Google Maps are ready
 - debug: (boolean)	set to true if you want to see errors in the Debug Console, else it will fail silently

## Usage
```javascript
isochrone.compute({
	lat: 48.860901,
	lng: 2.307405,
	type: 'duration',
	value: 10 * 60,
	mode: 'walking',
	callback: myCallback
});
```
Parameters:
 - lat: (float) latitude of origin. Mandatory.
 - lng: (float) longitude of origin. Mandatory.
 - type: (string) either 'distance' (isodistance) or 'duration' (isoduration). Mandatory.
 - value (float) maximum duration (in seconds) or distance (in meters or yards, see «system») to reach another point. Mandatory.
   - examples for type «duration»:
     - 30 seconds: 30
     - 10 minutes: 10 * 60 = 600
     - 1 hour and a half: 1h * 60 * 60 + 30min * 60 = 1 * 3600 + 30 * 60 = 5400
   - examples for type «distance», in metric system (meters, kilometers):
     - 500m: 500
     - 1km: 1 * 1000 = 1000
     - 5.5km: 5 * 1000 + 500 = 5500
   - examples for type «distance», in imperial system (yards, miles):
     - 500 yards: 500
     - 1mi: 1 * 1760 = 1760
     - 5.5mi: 5.5 * 1760 = 9680
 - mode: (string) mode used to rely the dots, either walking, bicycling, driving or transit. Mandatory.
 - callback: (function) function to call with the final polygon values. Mandatory.
   - function's arguments:
     - status: (string) either the [Google Maps API error codes](https://developers.google.com/maps/documentation/javascript/distancematrix#distance_matrix_status_codes) including the OK, or KO (bad configuration), LENGTH (returned array by Google API is not the correct length).
     - points: (array) array of objects, including «lat and lng» properties so that you can send it directly to [Google Maps polygon](https://developers.google.com/maps/documentation/javascript/shapes#polygon_add) in the «paths» property.
     - example :
       ```javascript
       var myCallback = function (status, points)
       {
       	if (status === 'OK')
       	{
       		var polygon = new google.maps.Polygon({path: points});
       		polygon.setMap(isochrone.map.map);
       	}
       };
       ```
 - system: (string) system to use, either 'imperial' (in miles) or 'metric' (in kilometers). Defaults to «metric» if omitted.
 - slices: (integer) number of polygon slices to compute. 4 slices means testing N/E/S/W (polygon cut in 4), 8 means testing N/NE/E/SE/S/SW/W/NW (polygon cut in 8). Defaults to 8, best is probably 16, maximum is 25 (hard limit of Google API, as we request all directions in one call to limit usage).
 - cycles: (integer) number of cycles to narrow the polygon down. The higher value, the better, but this will equals the number of API calls, so you may want to keep it low because of [API restrictions](https://developers.google.com/maps/documentation/javascript/distancematrix#UsageLimits) and to get faster results. Defaults to 10.
 - precision: (integer) percentage of accepted error on the final position, limiting API calls. For example with 5%, an isochrone of 10 minutes (600 seconds) will accept (0.05 * 600 =) 30 seconds of error (so the path would be between 9'30" and 10'30"). Defaults to 5.

# Isochrone and Isodistance with Google Maps API

Inspired by https://github.com/sandropaganotti-zz/isochrone-with-google-map and https://github.com/lydonchandra/isochrone-with-google-map

Isochrone is a polygon representing how far you would go from a single point in every direction, following each road in a given timeframe. It's the best way to find out where you should live if you want to be «at most 5 minutes away from a tube station».
Isodistance is similar, but ignores duration taken for traveling. For example by car you would go faster on highways, but with isodistance highways and sidewalks are the same.

- isochrone (same duration) or isodistance (same distance) library
- polygon definition: number of slices, number of cycles to make the precision better
- export polygons' points for future use (avoid computing everything every time)

# Demo

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
	callback: isochrone.addPolygon
});
```
Parameters:
 - lat: (float) latitude of origin. Mandatory.
 - lng: (float) longitude of origin. Mandatory.
 - type: (string) either 'distance' (isodistance) or 'duration' (isoduration). Mandatory.
 - value (float) maximum duration (in seconds) or distance (in miles or kilometers, see «system») to reach another point. Mandatory.
   - examples for type «duration»:
     - 30 seconds: 30
     - 10 minutes: 10 * 60 or 600
     - 1 hour and a half: 1h * 60 * 60 + 30min * 60, or 1 * 3600 + 30 * 60, or 5400
 - mode: (string) mode used to rely the dots, either walking, bicycling, driving or transit. Mandatory.
 - callback: (function) function to call with the final polygon values. Mandatory.
 - system: (string) system to use, either 'imperial' (in miles) or 'metric' (in kilometers). Defaults to «metric» if omitted.
 - slices: (integer) number of polygon slices to compute. 4 slices means testing N/E/S/W (polygon cut in 4), 8 means testing N/NE/E/SE/S/SW/W/NW (polygon cut in 8). Defaults to 8, best is probably 16, maximum is 25 (hard limit of Google API, as we request all directions in one call to limit usage).
 - cycles: (integer) number of cycles to narrow the polygon down. The higher value, the better, but this will equals the number of API calls, so you may want to keep it low because of [API restrictions](https://developers.google.com/maps/documentation/javascript/distancematrix#UsageLimits) and to get faster results. Defaults to 10.
 - precision: (integer) percentage of accepted error on the final position, limiting API calls. For example with 5%, an isochrone of 10 minutes (600 seconds) will accept (0.05 * 600 =) 30 seconds of error (so the path would be between 9'30" and 10'30"). Defaults to 5.
# this is a first commit, nothing is working for now :-)
# first functional release soon enough! Click on «Watch» in the upper right corner



# Isochrone and Isodistance with Google Maps API

Reboot of https://github.com/sandropaganotti-zz/isochrone-with-google-map for latest Google API

Isochrone is a polygon representing how far you would go from a single point in every direction, following each road. It's the best way to find out where you should live if you want to be «at most 5 minutes away from a tube station».
Isodistance is similar, but takes into account the median speed of roads (doesn't apply for pedestrian for example).

- isochrone (same duration) or isodistance (same distance) library
- polygon definition: number of points, number of tries
- export polygons for future use (avoid computing everything every time)

# Documentation

## Initialize

```javascript
isochrone.init({
	map: 'theMap', // The HTML ID of your map (say <div id="theMap"></div>)
	key: 'your-google-maps-api-key' // if not already loaded, please provide your Google Maps API key
});
```

## Usage

```javascript
isochrone.draw();
```
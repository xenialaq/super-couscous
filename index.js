import '@maptiler/sdk/dist/maptiler-sdk.css';

import * as maptilersdk from '@maptiler/sdk';
import * as toGeoJSON from '@mapbox/togeojson';
import log from 'loglevel';

const sportTypes = ['hiking', 'casual_walking', 'walking', 'cycling', 'running'];
const colors = ['#F0028D', '#8A278D', '#8A278D', '#002858', '#12CAB5', '#054674'];

const validStyles = {
  TOPO: 'TOPO',
  OUTDOOR: 'OUTDOOR',
  WINTER: 'WINTER',
  SATELLITE: 'SATELLITE',
  HYBRID: 'HYBRID',
};

const getStyleName = () => validStyles[(new URLSearchParams(window.location.search).get('style') || '').toUpperCase()] || validStyles.TOPO;

maptilersdk.config.apiKey = import.meta.env.VITE_MAP_API_KEY;

const map = new maptilersdk.Map({
  container: 'map',
  style: maptilersdk.MapStyle[getStyleName()],
  center: [-122.349358, 47.620422], // [lon, lat]
  zoom: 11,
  terrain: true,
  terrainControl: true,
  pitch: 0,
  bearing: -100,
  maxPitch: 50,
  maxZoom: 14,
});

const loadTracks = async () => {
  const activities = {};

  const loadOne = async (baseUrl, filename) => {
    const data = await fetch(`${baseUrl}/${filename}`).then((r) => r.text());
    const xml = new DOMParser().parseFromString(data, 'application/xml');
    const geojson = toGeoJSON.gpx(xml);
    const sportType = geojson.features[0].properties.type;
    log.debug(sportType, filename);
    activities[sportType] = activities[sportType] || [];
    activities[sportType].push(geojson);
  };

  const summary = await fetch('/activities/summary.json').then((r) => r.json(), () => []);
  await Promise.all(summary.map(
    (activity) => loadOne('/activities', `activity_${activity.activityId}.gpx`).catch(log.debug),
  ));

  const manifest = await fetch('/extra_activities/manifest.txt').then((r) => r.text(), () => '').then((txt) => txt.split('\n').filter((l) => l.endsWith('.gpx')));
  await Promise.all(manifest.map(
    (filename) => loadOne('/extra_activities', filename).catch(log.debug),
  ));

  const combined = Object.entries(activities)
    .map(([sportType, geojsons]) => [sportType, geojsons.reduce((acc, cur) => ({
      ...acc,
      features: [...acc.features, ...cur.features],
    }))]);

  combined.forEach(([sportType, geojson]) => {
    map.addSource(sportType, {
      type: 'geojson',
      data: geojson,
    });

    if (!colors[sportTypes.indexOf(sportType)]) {
      log.warn(`${sportType} is not mapped to a color, using default`);
    }

    map.addLayer({
      id: sportType,
      type: 'line',
      source: sportType,
      layout: {},
      paint: {
        'line-color': colors[sportTypes.indexOf(sportType)] || '#111',
        'line-width': 4,
        'line-opacity': 0.5,
      },
    });
  });
};

map.on('load', loadTracks);

document.querySelector('.mapstyles-select').addEventListener('change', (e) => {
  const search = new URLSearchParams(window.location.search);
  search.set('style', e.target.value);
  window.location.search = search.toString();
});

window.addEventListener('load', () => {
  document.querySelector('.mapstyles-select').value = getStyleName();
});

# super-couscous

## Download activity GPXs

Use Puppeteer to download all Garmin activities' GPX file based on your Garmin data.

First, export your Garmin data. *(You can also use the Garmin Connect CSV export without going through the pain, but you need to modify the downloader script to take CSV instead.)*

You then receive a download link.

Download and unzip the file.

Find the Garmin Connect summarized activities JSON.

Get you Maptiler API key.

Create a `.env` file with:

```
GARMIN_CONNECT_EMAIL= # Garmin email
GARMIN_CONNECT_PASSW= # Garmin password
GARMIN_EXPORT_SUMM_ACTS= # path to Garmin Connect summarized activities JSON
```
Run `npm run download`.

## Render activity GPXs on a map

Get you Maptiler API key.

Add to the `.env` file:

```
VITE_MAP_API_KEY= # Maptiler default key
```

Copy the downloaded GPXs into `public/activities`.

Copy the Garmin Connect summarized activities JSON into `public/activities/summary.json`.

Additionally, you can place any GPX file in `public/extra_activities`.

Run `npm start`.

## Note

You need at least 8GB RAM to render hundreds of activities.

You can lower the bandwidth consumption by reducing the tracking points & removing data extensions such as heart rates from the tracks.

Use `npm run build` for a production build, couple it with a static server with caching enabled and consider creating a `.env.production.local` file with an origin-restricted Maptiler key.

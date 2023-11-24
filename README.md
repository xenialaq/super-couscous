# super-couscous

## Download activity GPXs

Use Puppeteer to download all Garmin activities' GPX file based on your Garmin data.

First, export your Garmin data.

You then receive a download link.

Download and unzip the file.

Find the Garmin Connect summarized activities JSON and extract the value of `summarizedActivitiesExport`, which is a summarized list of activities.

*(You can also use the Garmin Connect 'All Activities' page and use a browser's Dev Tools to get an almost identical list of activities from the API by stitching together paginated results, with page size 100)*

Create a `.env` file with:

```
GARMIN_CONNECT_EMAIL= # Garmin email
GARMIN_CONNECT_PASSW= # Garmin password
GARMIN_EXPORT_SUMM_ACTS= # path to Garmin Connect summarized activities JSON
```
Run `npm run download`.

This cleans up personal information from the JSON and replaces it.

Then it launches Chrome to log into Garmin Connect and navigate to each activity page to export a GPX file.

Existing, downloaded activities are skipped.

Errors are printed for single activities but they do not interrupt the batch process.

You can initiate downloads multiple times to finish activities that failed due to network error.

You are never able to export GPX for some activities, hence they error every time.

## Reduce the size of activity GPXs

You can edit `stripper.js` to use 3D/2D distance, change lat/long precision, exclude certain data fields, etc.

Run `npm run strip`.

Files are backed up with a `.bak` extension.

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

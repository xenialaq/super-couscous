import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import { getPreciseDistance } from 'geolib';
import { readdirSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import pino from 'pino';
import prompts from 'prompts';

import 'dotenv/config';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
  },
});

const removeNeighboringPts = (filename, xml) => {
  const dom = new DOMParser().parseFromString(xml);
  const gpx = dom.getElementsByTagName('gpx')[0];
  const trkseg = gpx.getElementsByTagName('trkseg')[0];
  const trkpts = trkseg.getElementsByTagName('trkpt');
  let lastLat = 0; let lastLon = 0; let lastEle = 0;
  const toKeep = [];
  for (let i = 0; i < trkpts.length; i += 1) {
    const cloned = trkpts[i].cloneNode(true);
    const lat = Number(cloned.getAttribute('lat'));
    const lon = Number(cloned.getAttribute('lon'));
    const ele = Number(cloned.getElementsByTagName('ele')[0].textContent);
    let dist = getPreciseDistance(
      { latitude: lat, longitude: lon },
      { latitude: lastLat, longitude: lastLon },
    ); // meter
    dist = Math.sqrt(dist * dist, (lastEle - ele) ** 2); // meter

    if (dist < 3.5) {
      // discard point
      lastLat = lat; lastLon = lon; lastEle = ele;
    } else {
      // include but make point more compact
      cloned.setAttribute('lat', lat.toFixed(5));
      cloned.setAttribute('lon', lon.toFixed(5));
      cloned.getElementsByTagName('ele')[0].nodeValue = ele.toFixed(1);
      const extensions = cloned.getElementsByTagName('extensions')[0];
      if (extensions) {
        cloned.removeChild(extensions);
      }
      toKeep.push(cloned);
    }
    lastLat = lat; lastLon = lon; lastEle = ele;
  }

  logger.info([filename, trkseg.getElementsByTagName('trkpt').length, '->', toKeep.length].join(' '));

  while (trkseg.firstChild) {
    trkseg.removeChild(trkseg.lastChild);
  }
  // eslint-disable-next-line no-restricted-syntax
  for (const child of toKeep) {
    trkseg.appendChild(child);
  }
  return new XMLSerializer().serializeToString(dom);
};

async function strip() {
  const { inputDir } = await prompts({
    type: 'text',
    name: 'inputDir',
    message: 'Specify an input folder',
    initial: resolve(homedir(), 'Downloads', 'garmin_gpx'),
  });

  const files = readdirSync(inputDir).filter((f) => f.match(/\.gpx$/g));

  await Promise.all(files.map(async (f) => {
    try {
      const targetPath = resolve(inputDir, f);
      const backupPath = `${targetPath}.bak`;
      const gpx = await readFile(targetPath, 'utf-8');
      await writeFile(backupPath, gpx);
      const modified = removeNeighboringPts(f, gpx);
      await writeFile(targetPath, modified);
    } catch (error) {
      logger.error(`${f} conversion failed.`);
      logger.error(error);
    }
  }));
}

strip().then(() => logger.info('done!'), logger.error);

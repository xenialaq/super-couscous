import { eachSeries, retry } from 'async';
import { find } from 'geo-tz';
import moment from 'moment-timezone';
import { readFileSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import pino from 'pino';
import prompts from 'prompts';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import 'dotenv/config';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
  },
});

puppeteer.use(StealthPlugin());

const wait = (ms) => new Promise((r) => { setTimeout(r, ms); });

async function download() {
  const { downloadPath } = await prompts({
    type: 'text',
    name: 'downloadPath',
    message: 'Specify a download folder',
    initial: resolve(homedir(), 'Downloads', 'garmin_gpx'),
  });

  const { jsonPath } = await prompts({
    type: 'text',
    name: 'jsonPath',
    message: 'Specify the summarized activities export JSON',
    initial: process.env.GARMIN_EXPORT_SUMM_ACTS,
  });

  const json = readFileSync(jsonPath, 'utf8');

  const activities = JSON.parse(json)[0].summarizedActivitiesExport;

  const browser = await puppeteer.launch({
    headless: false,
  });
  const page = await browser.newPage();

  await page.goto('https://connect.garmin.com/modern/');
  await wait(2e3);

  const rememberMe = '.signin__form__input--remember';
  await page.waitForSelector(rememberMe);
  await page.click(rememberMe);

  const email = '#email';
  await page.type(email, process.env.GARMIN_CONNECT_EMAIL);
  logger.debug('email entered');

  const password = '#password';
  await page.type(password, process.env.GARMIN_CONNECT_PASSW);
  logger.debug('password entered');

  const submit = '.portal-button > button';
  await page.click(submit);
  logger.debug('logging in');

  await wait(5e3);

  const cdpsession = await page.target().createCDPSession();
  cdpsession.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath });

  await eachSeries(activities, async (activity) => {
    const tz = find(activity.startLatitude || 0, activity.startLongitude || 0)[0] || 'America/Los_Angeles';
    const startTime = moment(activity.beginTimestamp).tz(tz).format('YYYY-MM-DD HHmm z');
    logger.info(`downloading [${activity.activityId}] ${activity.name} (${startTime})`);

    if (readdirSync(downloadPath).filter((f) => f.endsWith(`activity_${activity.activityId}.gpx`)).length > 0) {
      logger.info(`activity_${activity.activityId}.gpx already exists - skipped`);
      return;
    }

    try {
      await page.goto(`https://connect.garmin.com/modern/activity/${activity.activityId}`);

      await wait(2e3);

      const gearBtn = 'button.dropdown-trigger.page-navigation-action[title="More..."]';
      await page.waitForSelector(gearBtn);
      await page.click(gearBtn);

      await wait(2e3);

      const exportBtn = '#btn-export-gpx';
      await page.waitForSelector(exportBtn);
      // No action for parent (multisport) activity but we do not care
      await page.click(exportBtn);

      await retry({
        times: 6,
        interval(retryCount) {
          return 50 * 2 ** retryCount;
        },
      }, async () => {
        const completes = readdirSync(downloadPath).filter((f) => f.endsWith(`activity_${activity.activityId}.gpx`));
        if (completes.length === 0) {
          throw new Error('download is still pending or has never initiated');
        }
      });

      logger.info(`activity_${activity.activityId}.gpx - downloaded`);
    } catch (e) {
      logger.error(`activity_${activity.activityId}.gpx - failed`);
      logger.error(e);
    }
  });

  browser.close();
}

download().then(() => logger.info('done!'), logger.error);

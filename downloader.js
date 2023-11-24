import { eachSeries, retry } from 'async';
import { find } from 'geo-tz';
import { pick } from 'lodash-es';
import moment from 'moment-timezone';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
    message: 'Specify the summarized activities JSON',
    initial: process.env.GARMIN_SUMM_ACTS,
  });

  const json = readFileSync(jsonPath, 'utf8');

  const activities = JSON.parse(json).map((activity) => pick(activity, [
    'name',
    'activityId',
    'activityName',
    'description',
    'startTimeLocal',
    'startTimeGMT',
    'activityType',
    'eventType',
    // 'comments',
    // 'parentId',
    'distance',
    'duration',
    'elapsedDuration',
    'movingDuration',
    'elevationGain',
    'elevationLoss',
    'averageSpeed',
    'maxSpeed',
    'startLatitude',
    'startLongitude',
    // 'hasPolyline',
    // 'ownerId',
    // 'ownerDisplayName',
    // 'ownerFullName',
    // 'ownerProfileImageUrlSmall',
    // 'ownerProfileImageUrlMedium',
    // 'ownerProfileImageUrlLarge',
    // 'calories',
    // 'bmrCalories',
    // 'averageHR',
    // 'maxHR',
    // 'averageRunningCadenceInStepsPerMinute',
    // 'maxRunningCadenceInStepsPerMinute',
    // 'maxLapAvgRunCadence',
    // 'averageBikingCadenceInRevPerMinute',
    // 'maxBikingCadenceInRevPerMinute',
    // 'averageSwimCadenceInStrokesPerMinute',
    // 'maxSwimCadenceInStrokesPerMinute',
    // 'averageSwolf',
    // 'activeLengths',
    // 'steps',
    // 'conversationUuid',
    // 'conversationPk',
    // 'numberOfActivityLikes',
    // 'numberOfActivityComments',
    // 'likedByUser',
    // 'commentedByUser',
    // 'activityLikeDisplayNames',
    // 'activityLikeFullNames',
    // 'activityLikeProfileImageUrls',
    // 'requestorRelationship',
    // 'userRoles',
    // 'privacy',
    // 'userPro',
    // 'courseId',
    // 'poolLength',
    // 'unitOfPoolLength',
    // 'hasVideo',
    // 'videoUrl',
    'timeZoneId',
    'beginTimestamp',
    'sportTypeId',
    // 'avgPower',
    // 'maxPower',
    // 'aerobicTrainingEffect',
    // 'anaerobicTrainingEffect',
    // 'strokes',
    // 'normPower',
    // 'leftBalance',
    // 'rightBalance',
    // 'avgLeftBalance',
    // 'max20MinPower',
    // 'avgVerticalOscillation',
    // 'avgGroundContactTime',
    // 'avgStrideLength',
    // 'avgFractionalCadence',
    // 'maxFractionalCadence',
    // 'trainingStressScore',
    // 'intensityFactor',
    // 'vO2MaxValue',
    // 'avgVerticalRatio',
    // 'avgGroundContactBalance',
    // 'lactateThresholdBpm',
    // 'lactateThresholdSpeed',
    // 'maxFtp',
    // 'avgStrokeDistance',
    // 'avgStrokeCadence',
    // 'maxStrokeCadence',
    // 'workoutId',
    // 'avgStrokes',
    // 'minStrokes',
    // 'deviceId',
    'minTemperature',
    'maxTemperature',
    'minElevation',
    'maxElevation',
    // 'avgDoubleCadence',
    // 'maxDoubleCadence',
    // 'summarizedExerciseSets',
    // 'maxDepth',
    // 'avgDepth',
    // 'surfaceInterval',
    // 'startN2',
    // 'endN2',
    // 'startCns',
    // 'endCns',
    // 'summarizedDiveInfo',
    // 'activityLikeAuthors',
    // 'avgVerticalSpeed',
    // 'maxVerticalSpeed',
    // 'floorsClimbed',
    // 'floorsDescended',
    // 'manufacturer',
    // 'diveNumber',
    'locationName',
    // 'bottomTime',
    // 'lapCount',
    'endLatitude',
    'endLongitude',
    // 'minAirSpeed',
    // 'maxAirSpeed',
    // 'avgAirSpeed',
    // 'avgWindYawAngle',
    // 'minCda',
    // 'maxCda',
    // 'avgCda',
    // 'avgWattsPerCda',
    // 'flow',
    // 'grit',
    // 'jumpCount',
    // 'caloriesEstimated',
    // 'caloriesConsumed',
    // 'waterEstimated',
    // 'waterConsumed',
    // 'maxAvgPower_1',
    // 'maxAvgPower_2',
    // 'maxAvgPower_5',
    // 'maxAvgPower_10',
    // 'maxAvgPower_20',
    // 'maxAvgPower_30',
    // 'maxAvgPower_60',
    // 'maxAvgPower_120',
    // 'maxAvgPower_300',
    // 'maxAvgPower_600',
    // 'maxAvgPower_1200',
    // 'maxAvgPower_1800',
    // 'maxAvgPower_3600',
    // 'maxAvgPower_7200',
    // 'maxAvgPower_18000',
    // 'excludeFromPowerCurveReports',
    // 'totalSets',
    // 'activeSets',
    // 'totalReps',
    // 'minRespirationRate',
    // 'maxRespirationRate',
    // 'avgRespirationRate',
    // 'trainingEffectLabel',
    // 'activityTrainingLoad',
    // 'avgFlow',
    // 'avgGrit',
    // 'minActivityLapDuration',
    // 'avgStress',
    // 'startStress',
    // 'endStress',
    // 'differenceStress',
    // 'maxStress',
    // 'aerobicTrainingEffectMessage',
    // 'anaerobicTrainingEffectMessage',
    // 'splitSummaries',
    // 'hasSplits',
    // 'moderateIntensityMinutes',
    // 'vigorousIntensityMinutes',
    // 'maxBottomTime',
    // 'hasSeedFirstbeatProfile',
    // 'calendarEventId',
    // 'calendarEventUuid',
    // 'avgGradeAdjustedSpeed',
    // 'avgWheelchairCadence',
    // 'maxWheelchairCadence',
    // 'avgJumpRopeCadence',
    // 'maxJumpRopeCadence',
    // 'gameName',
    // 'differenceBodyBattery',
    // 'gameType',
    // 'curatedCourseId',
    // 'matchedCuratedCourseId',
    // 'purposeful',
    // 'pr',
    // 'manualActivity',
    // 'autoCalcCalories',
    // 'elevationCorrected',
    // 'atpActivity',
    // 'favorite',
    // 'decoDive',
    // 'parent',
  ]));

  writeFileSync(jsonPath, JSON.stringify(activities, null, 2));
  logger.warn('removed personal info from summary file');

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
    logger.info(`downloading [${activity.activityId}] ${activity.name || activity.activityName} (${startTime})`);

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

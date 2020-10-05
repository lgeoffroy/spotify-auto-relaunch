const dotenv = require('dotenv');
const SpotifyApi = require('./api');
const { displayTime, skipAd, sleep, updateSlackStatus } = require('./utils');

dotenv.config();

const api = new SpotifyApi();

const main = async () => {
  let isAd = true;
  try {
    let trackInfos = await api.getCurrentTrackInfos();

    if (trackInfos.error && trackInfos.error.status === 401) {
      await api.restart();
      trackInfos = await api.getCurrentTrackInfos();
    }

    isAd = trackInfos.currently_playing_type === 'ad';
    console.log(`${(new Date()).toLocaleString('fr')}: playing a ${trackInfos.currently_playing_type}`);

    if (isAd) {
      await skipAd();
    } else {
      console.log(`${trackInfos.item.artists[0].name} - ${trackInfos.item.name} (${displayTime(trackInfos.progress_ms)} / ${displayTime(trackInfos.item.duration_ms)})`)
      const timer = trackInfos.item.duration_ms - trackInfos.progress_ms + 1000; // Add 1s delay to avoid fetching too much time at the end of the song.
      console.log(`Sleeping for ${displayTime(timer)}.\n`);
      if (process.env.SLACK_API_TOKEN) {
        await updateSlackStatus({
          status_text: `${trackInfos.item.artists[0].name} - ${trackInfos.item.name}`,
          status_emoji: ':musical_note:',
          status_expiration: Math.round((Date.now() + timer) / 1000 + 60), // status will be override; add a minute to avoid time synchronization problems
        });
      }
      await sleep(timer);
    }
  } catch (error) {
    if (error.type === 'invalid-json') {
      console.log('Nothing playing.');
      await sleep((isAd ? 2 : 60) * 1000);
    } else {
      console.error(error);
      process.exit(1)
    }
  }
};

const loop = async () => {
  await skipAd();
  while (true) {
    await main();
  }
};

loop();

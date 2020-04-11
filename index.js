const dotenv = require('dotenv');
const SpotifyApi = require('./api');
const { displayTime, skipAd, sleep } = require('./utils');

dotenv.config();

const api = new SpotifyApi();

const main = async () => {
  try {
    let trackInfos = await api.getCurrentTrackInfos();

    if (trackInfos.error && trackInfos.error.status === 401) {
      await api.restart();
      trackInfos = await api.getCurrentTrackInfos();
    }

    const isTrack = trackInfos.currently_playing_type === 'track';
    console.log(`${(new Date()).toLocaleString()}: playing a ${trackInfos.currently_playing_type}`);

    if (isTrack) {
      console.log(`${trackInfos.item.artists[0].name} - ${trackInfos.item.name} (${displayTime(trackInfos.progress_ms)} / ${displayTime(trackInfos.item.duration_ms)})`)
      const timer = trackInfos.item.duration_ms - trackInfos.progress_ms + 1000; // Add 1s delay to avoid fetching too much time at the end of the song.
      console.log(`Sleeping for ${displayTime(timer)}.\n`);
      await sleep(timer);
    } else {
      await skipAd();
    }
  } catch (error) {
    if (error.type === 'invalid-json') {
      console.log('Nothing playing.');
      await sleep(60 * 1000); // Nothing playing, wait 1 mn before retrying.
    } else {
      console.log(error);
      process.exit(1)
    }
  }
};

const loop = async () => {
  while (true) {
    await main();
  }
};

loop();

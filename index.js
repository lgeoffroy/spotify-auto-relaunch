const { exec } = require('child_process');
const dotenv = require('dotenv');
const fetch = require("node-fetch");

dotenv.config();

const getCurrentTrackInfos = () => fetch('https://api.spotify.com/v1/me/player/currently-playing', {
  method: 'GET',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.SPOTIFY_AUTHORIZATION_CODE}`,
  },
})
  .then((response) => response.json());

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const play = () => exec('/usr/bin/dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Play');
const relaunch = () => exec('/usr/bin/killall spotify && /usr/bin/spotify &');

const skipAd = async () => {
  relaunch();
  await sleep(5000);
  play();
}

const displayTime = (ms) => {
  const s = (ms / 1000).toFixed(0);
  const m = s / 60;

  return `${m.toFixed(0)}:${`${s % 60}`.padStart(2, '0')}`;
};

const main = async () => {
  try {
    const trackInfos = await getCurrentTrackInfos();

    if (trackInfos.error && trackInfos.error.status === 401) {
      console.log('Seems like the code is invalid. Please regenerate it here:');
      console.log('https://developer.spotify.com/console/get-users-currently-playing-track/?market=&additional_types=');
      process.exit(1)
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
      await sleep(10000); // 10s
    }
  }
};

const loop = async () => {
  while (true) {
    await main();
  }
};

loop();

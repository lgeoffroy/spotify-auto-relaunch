const { exec } = require('child_process');

const getEncodedCredentials = () => {
  const creds = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;

  return Buffer.from(creds).toString('base64');
};

const navigate = async (page, url) => Promise.all([
    page.goto(url),
    page.waitForNavigation(),
]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const play = () => exec('/usr/bin/dbus-send --print-reply --dest=org.mpris.MediaPlayer2.spotify /org/mpris/MediaPlayer2 org.mpris.MediaPlayer2.Player.Play');
const relaunchSpotify = () => exec('/usr/bin/killall spotify && /usr/bin/nohup /usr/share/spotify/spotify &');

const skipAd = async () => {
  relaunchSpotify();
  await sleep(5000);
  play();
};

const displayTime = (ms) => {
  const s = (ms / 1000).toFixed(0);
  const m = s / 60;

  return `${m.toFixed(0)}:${`${s % 60}`.padStart(2, '0')}`;
};

module.exports = {
  displayTime,
  getEncodedCredentials,
  navigate,
  skipAd,
  sleep,
};
const fetch = require('node-fetch');
const puppeteer = require('puppeteer');
const { getEncodedCredentials, navigate } = require('./utils');

class SpotifyApi {
  async restart() {
    await this.getAuthorizationCode();
    await this.getAccessToken();

    clearInterval(this.interval);
    this.interval = setInterval(async () => {
      if (this.fetchEpoch + (this.expiresIn * 1000) <= Date.now()) {
        await this.refreshAccessToken();
      }
    }, 5000);
  }

  async getAuthorizationCode() {
    const url = `https://accounts.spotify.com/fr/authorize?client_id=${process.env.SPOTIFY_CLIENT_ID}&response_type=code&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}&scope=user-read-playback-state&state=my_state`;

    const browserOptions = {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: 'google-chrome-stable',
      headless: true,
    };
    const browser = await puppeteer.launch(browserOptions);
    const page = await browser.newPage();

    await navigate(page, url);

    await page.type('input[name="username"]', process.env.SPOTIFY_USERNAME);
    await page.type('input[name="password"]', process.env.SPOTIFY_PASSWORD);
    await page.click('#login-button');

    await page.waitForNavigation();

    try {
      await page.click('#auth-accept');
      await page.waitForNavigation();
    } catch (e) {
      // may already be authorized
    }

    const urlParams = new URLSearchParams(page.url().split('?')[1]);
    this.code = urlParams.get('code');
    browser.close();
  }

  async getAccessToken() {
    this.fetchEpoch = Date.now();
    const data = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${getEncodedCredentials()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=authorization_code&code=${this.code}&redirect_uri=${process.env.SPOTIFY_REDIRECT_URI}`,
    })
      .then((response) => response.json())
      .catch((error) => {
        // TODO handle errors here
        console.error('Error getAccessToken', error);
        throw error;
      });

    this.accessToken = data.access_token;
    this.expiresIn = data.expires_in;
    this.refreshToken = data.refresh_token;
  }

  async refreshAccessToken() {
    this.fetchEpoch = Date.now();
    const data = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${getEncodedCredentials()}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=refresh_token&refresh_token=${this.refreshToken}`,
    })
      .then((response) => response.json())
      .catch((error) => {
        // TODO handle errors here
        console.error('Error refreshToken', error);
        throw error;
      });

    this.accessToken = data.access_token;
    this.expiresIn = data.expires_in;
    this.refreshToken = data.refresh_token;
  }

  getCurrentTrackInfos() {
    return fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
    })
      .then((response) => response.json());
  }
}

module.exports = SpotifyApi;

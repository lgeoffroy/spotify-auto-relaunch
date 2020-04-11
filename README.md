# spotify-auto-relaunch

Just generate an authorization code from here: https://developer.spotify.com/console/get-users-currently-playing-track/?market=&additional_types=

Put it in .env as SPOTIFY_AUTHORIZATION_CODE and you're done!

then `node index.js`.

```
lgeoffroy@laptop:~/spotify-auto-relaunch[master]$ node index.js
4/11/2020, 6:25:01 PM: playing a track
Jahneration - Gone For Long (1:54 / 3:17)
Sleeping for 2:24.

4/11/2020, 6:27:25 PM: playing a ad
Nothing playing.
4/11/2020, 6:27:41 PM: playing a track
Jahneration - Cease Fire (0:11 / 5:27)
Sleeping for 5:17.
```

### TODO:

- Get authorization code automatically
- Wait for spotify to be ready instead of waiting a few seconds
- Hide/minimize spotify on relaunch
- Better handle errors
- Completely rewrite using only dbus...

var express = require('express');
var app = express();

var config = require('./config').config;
var loginCallback = require('./config').loginCallback;
var readmeConfig = require('./config').readmeConfig;
var utils = require('./utils');
var request = require('request');
var querystring = require('querystring');

var oauth2 = require('simple-oauth2')({
  site: true, // Don't delete this, weird requirement of simple-oauth2
  clientSecret: config.clientSecret,
  clientID: config.clientID,
  authorizationPath: config.authorizationPath,
  tokenPath: config.tokenPath,
});

// Makes initail reqeust to oauth server
var redirect = function (req, res) {

  // Generates url using info from config
  var authorizationUri = oauth2.authCode.authorizeURL({
    redirect_uri: `${readmeConfig.redirect_uri}`,
    scope: config.scope,
    state: `${req.query.redirect}`,
  });

  res.redirect(authorizationUri);
};

// Handles requesting token and forming JWT url to readme
var callback = function (req, res) {

  req.query.redirect = req.query.state
  var code = req.query.code;

  // Exchanges code for token
  var auth = 'Basic ' + Buffer.from(config.clientID + ':' + config.clientSecret).toString('base64');
  var tokenReqOptions = {
    url: config.tokenPath,
    json: {
      code: code
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: auth,
      'User-Agent': 'ReadMe',
      'X-Airbnb-API-Key': config.clientID,
    },
    method: 'POST'
  }

  // callback for getToken
  request(tokenReqOptions, (err, r, body) => {
    if (err) { return res.status(500).send('Access Token Error: ' + err.message); }
    if (body.error_code) { return res.status(body.error_code).send('Access Token Error.'); }

    var access_token = body.oauth2_authorization.access_token

    // Fetches user information
    var reqOptions = {
      url: config.profilePath,
      json: true,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        'User-Agent': 'ReadMe',
        'X-Airbnb-API-Key': config.clientID,
        'X-Airbnb-OAuth-Token': access_token
      },
    };

    request(reqOptions, (err, r, body) => {

      // Transforms user information into readme format
      // More info on the format at https://readme.readme.io/v2.0/docs/passing-data-to-jwt
      var userData = loginCallback(body, access_token);

      // Redirects to readme JWT url
      return req.utils.jwt(userData);
    });
  });
};

app.set('views', './');
app.set('view engine', 'pug');
app.use(express.cookieParser());
app.use(utils.readmeSetup);

app.get('/', (req, res) => res.redirect('/oauth'));
app.get('/oauth', redirect);
app.get('/oauth/callback', callback);

var port = process.env.PORT || 3001;
app.listen(port);

console.log('Express server started on port ' + port);

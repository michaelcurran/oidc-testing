const bodyParser = require("body-parser");
const express = require("express");
const request = require("superagent");
const router = express.Router();

const authURL = process.env.AUTH_URL;
const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const oauthURL = `${authURL}/oauth2/default`;
const redirectUri = process.env.REDIRECT_URI;

let endpoints = {}

request
  .get(`${authURL}/oauth2/default/.well-known/openid-configuration`)
  .then(resp => {
    endpoints = resp.body;
  })
  .catch(error => {
    console.log(error);
  });

router.use(bodyParser.urlencoded({ extended: true }));

router.get("/", (req, res, next) => {
  res.render("login", {
    title: "Simple OIDC Authentication"
  });
});

router.post("/", (req, res, next) => {
  const body = {
    username: req.body.username,
    password: req.body.password,
    options: {
      multiOptionalFactorEnroll: false,
      warnBeforePasswordExpired: false
    }
  };

  request
    .post(`${authURL}/api/v1/authn`)
    .send(JSON.stringify(body))
    .set("Accept-Type", "application/json")
    .set("Content-Type", "application/json")
    .then(resp => {
      if (resp.status === 200) {
        // TODO: randomize and store state/nonce values, add verify
        request
          .get(endpoints.authorization_endpoint)
          .query({ response_type: "code" })
          .query({ client_id: clientId })
          .query({ redirect_uri: redirectUri })
          .query({ state: "abcdefg1234567890" })
          .query({ nonce: "1234567890abcdefg" })
          .query({ sessionToken: resp.body.sessionToken })
          .query({ scope: "openid email profile offline_access" })
          .then(resp => {
            const text = JSON.parse(resp.text); 
            res.cookie('access_token', text.access_token, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.cookie('id_token', text.id_token, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.cookie('expires_in', text.expires_in, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.cookie('refresh_token', text.refresh_token, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.redirect("/");
          })
          .catch(error => {
            console.log(error);
          });
      }
    }).catch(error => {
      console.log(error);
      res.send(error.to_json);
    });
});

router.get("/callback", (req, res, next) => {
  request
    .post(endpoints.token_endpoint)
    .query({ client_id: clientId })
    .query({ client_secret: clientSecret })    
    .query({ grant_type: "authorization_code" })
    .query({ redirect_uri: redirectUri })
    .query({ code: req.query.code })
    .set("Accept-Type", "application/json")
    .set("Content-Type", "application/x-www-form-urlencoded")
    .then(resp => {
      res.send(resp.body);
    })
    .catch(error => {
      console.log(error);
    });
});

module.exports = router;

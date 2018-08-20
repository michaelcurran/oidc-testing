const cookie = require("cookie");
const express = require("express");
const jwtDecode = require("jwt-decode");
const OktaJwtVerifier = require("@okta/jwt-verifier");
const request = require("superagent");

const clientId = process.env.CLIENT_ID;
const clientSecret = process.env.CLIENT_SECRET;
const oauthURL = `${process.env.AUTH_URL}/oauth2/default`;
const redirectUri = process.env.REDIRECT_URI;
const router = express.Router()

let endpoints = {}

request
  .get(`${oauthURL}/.well-known/openid-configuration`)
  .then(resp => {
    endpoints = resp.body;
  })
  .catch(error => {
    console.log(error);
  });

router.get("/", (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || "");

  if (cookies.id_token === undefined) {
    res.redirect("login");
  } else {
    const oktaJwtVerifier = new OktaJwtVerifier({
      issuer: oauthURL
    });

    oktaJwtVerifier.verifyAccessToken(cookies.access_token)
    .then(jwt => {
      const id = jwtDecode(cookies.id_token);
      res.render("index", {
        title: "Simple OIDC Authentication",
        user: id.name
      });
    })
    .catch(error => {
      if (error.message === "Jwt is expired" && cookies.refresh_token) {
        request.post(endpoints.token_endpoint)
          .set("Accept-Type", "application/json")
          .set("Content-Type", "application/x-www-form-urlencoded")
          .query({ grant_type: "refresh_token" })
          .query({ client_id: clientId })
          .query({ client_secret: clientSecret })
          .query({ redirect_uri: redirectUri })
          .query({ scope: "openid email profile avatar offline_access" })
          .query({ refresh_token: cookies.refresh_token })
          .then(resp => {
            const id = jwtDecode(cookies.id_token);
            const text = JSON.parse(resp.text);

            res.cookie('access_token', text.access_token, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.cookie('id_token', text.id_token, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});
            res.cookie('expires_in', text.expires_in, {maxAge: 90000000, httpOnly: true, secure: false, overwrite: true});

            res.render("index", {
              title: "Simple OIDC Authentication",
              user: id.name
            });
          }).catch(err => {
            console.log(err);
          });
      } else {
        res.redirect("login", {
          title: "Simple OIDC Custom App Authentication"
        });
      }
    });
  }
})

module.exports = router

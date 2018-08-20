# oidc-testing

This functions basically as a PoC and simple testing app for OIDC auth flows with Okta.  I purposely made calls directly to the Okta API endpoints instead of using a library to handle these things for me.  

## Install

1. Run `npm install`
2. Create an empty .env file:  `touch .env`
3. Fill in the following values into the .env file:

```
AUTH_URL=https://{company}.oktapreview.com
CLIENT_ID={your_applications_client_id}
CLIENT_SECRET={your_applications_client_secret}
REDIRECT_URI=http://localhost:3000/login/callback"
```

4. Run `npm start`
5. Go to `http://localhost:3000` in your browser and login with an Okta user

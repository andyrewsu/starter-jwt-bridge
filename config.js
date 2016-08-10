exports.config = {
  clientID: "",
  clientSecret: "",
  authorizationPath: "",
  tokenPath: "",
  profilePath: "",
  scope: "",
};

// At this point the user has been authenticated and body contains
// the info your server returned about them.
// Return the user info you want to pass to readme
exports.loginCallback = function(body){
  // See readme.readme.io/jwt for more specific info about the format
  return {
  	'email': body.email,
    'name': body.name,
    'keys': {
			api_key: body.api_key,
      name: body.project_name
    }
  };
};

// Readme config -- automicatically configured for your project
exports.readmeConfig = {
  redirect_uri: "http://localhost:3002/p/readme/oauth/callback",
  readme_url: README_URL,
  jwt_secret: JWT_SECRET
};
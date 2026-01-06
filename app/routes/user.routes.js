const { authJwt } = require("../middleware");

// A simple controller for the user profile
const userProfile = (req, res) => {
    // The user's information is attached to the request in the JWT middleware
    res.status(200).send({
        message: `Welcome, ${req.username}! This is your profile.`
    });
};

module.exports = function(app) {
  app.use(function(req, res, next) {
    res.header(
      "Access-Control-Allow-Headers",
      "x-access-token, Origin, Content-Type, Accept"
    );
    next();
  });

  app.get(
    "/api/profile",
    [authJwt.verifyToken],
    userProfile
  );
};

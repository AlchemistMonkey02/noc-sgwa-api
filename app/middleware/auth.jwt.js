const jwt = require("jsonwebtoken");
const config = require("../config/auth.config.js");

const verifyToken = (req, res, next) => {
  let token = req.cookies.jwt;

  if (!token) {
    const err = new Error("No token provided!");
    err.statusCode = 403;
    return next(err);
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      const error = new Error("Unauthorized!");
      error.statusCode = 401;
      return next(error);
    }
    req.userId = decoded.id;
    req.username = decoded.username;
    next();
  });
};

const authJwt = {
  verifyToken: verifyToken,
};
module.exports = authJwt;

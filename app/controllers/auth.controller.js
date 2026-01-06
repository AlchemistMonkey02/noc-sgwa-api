const config = require("../config/auth.config");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

exports.signup = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Validation
    if (!username || !password) {
      const err = new Error("Username and password are required.");
      err.statusCode = 400;
      return next(err);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      const err = new Error("Failed! Username is already in use!");
      err.statusCode = 400;
      return next(err);
    }

    // Check if email exists (if provided)
    if (email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        const err = new Error("Failed! Email is already in use!");
        err.statusCode = 400;
        return next(err);
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email: email || undefined,
      password: hashedPassword,
      role: role || "user",
    });

    await newUser.save();

    res.status(201).send({
      message: "User was registered successfully!",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    // Handle mongoose validation errors
    if (error.name === "ValidationError") {
      const err = new Error(Object.values(error.errors).map(e => e.message).join(", "));
      err.statusCode = 400;
      return next(err);
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    // Add a guard clause for the request body
    if (!req.body || Object.keys(req.body).length === 0) {
      const err = new Error(
        "Request body is missing or empty. Ensure Content-Type is set to application/json.",
      );
      err.statusCode = 400;
      return next(err);
    }

    const { username, password } = req.body;

    if (!username || !password) {
      const err = new Error("Username and password are required.");
      err.statusCode = 400;
      return next(err);
    }

    // Find user by username
    const user = await User.findOne({ username });

    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      return next(err);
    }

    // Check if user is active
    if (!user.isActive) {
      const err = new Error("User account is deactivated. Please contact admin.");
      err.statusCode = 403;
      return next(err);
    }

    // Validate password
    const passwordIsValid = await bcrypt.compare(password, user.password);

    if (!passwordIsValid) {
      const err = new Error("Invalid password!");
      err.statusCode = 401;
      return next(err);
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role,
      },
      config.secret,
      {
        expiresIn: config.jwtExpiration, // 24 hours
      },
    );

    // Set cookie
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: config.jwtExpiration * 1000, // convert to milliseconds
      secure: process.env.NODE_ENV === "production", // Only use secure cookies in production
      sameSite: "strict",
    });

    res.status(200).send({
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      accessToken: token,
      message: "Login successful!",
    });
  } catch (error) {
    // Pass generic server errors to the error handler
    next(error);
  }
};

exports.logout = (req, res) => {
  res.cookie("jwt", "", { httpOnly: true, expires: new Date(0) });
  res.status(200).send({ message: "Logout successful!" });
};

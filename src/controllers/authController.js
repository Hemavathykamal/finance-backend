const userService = require("../services/userService");

function register(req, res, next) {
  try {
    const user = userService.register(req.body);
    res.status(201).json({ message: "User registered successfully", user });
  } catch (err) {
    next(err);
  }
}

function login(req, res, next) {
  try {
    const result = userService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { register, login, me };

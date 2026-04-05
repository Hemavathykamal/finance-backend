const userService = require("../services/userService");

function listUsers(req, res, next) {
  try {
    const users = userService.listUsers();
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

function getUser(req, res, next) {
  try {
    const user = userService.getUserById(req.params.id);
    res.json({ data: user });
  } catch (err) {
    next(err);
  }
}

function updateUser(req, res, next) {
  try {
    const updated = userService.updateUser(req.params.id, req.body);
    res.json({ message: "User updated", data: updated });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, getUser, updateUser };

// validate() takes a schema object where each key is a field name
// and the value is a function that returns an error string or null
// if any field fails, we return a 400 with all the errors at once
function validate(schema) {
  return (req, res, next) => {
    const errors = {};
    for (const [field, validator] of Object.entries(schema)) {
      const err = validator(req.body[field], req.body);
      if (err) errors[field] = err;
    }
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ error: "Validation failed", details: errors });
    }
    next();
  };
}

// small reusable validator functions used to build schemas below

const required = (label) => (val) =>
  val === undefined || val === null || String(val).trim() === ""
    ? `${label} is required`
    : null;

const isEmail = (val) =>
  required("Email")(val) ||
  (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : "Invalid email format");

const isRole = (val) =>
  required("Role")(val) ||
  (["viewer", "analyst", "admin"].includes(val) ? null : "Role must be viewer, analyst, or admin");

const isStatus = (val) =>
  val === undefined
    ? null
    : ["active", "inactive"].includes(val)
    ? null
    : "Status must be active or inactive";

// amount must be a number greater than zero
const isPositiveNumber = (label) => (val) => {
  if (val === undefined || val === null || String(val).trim() === "")
    return `${label} is required`;
  const num = Number(val);
  if (isNaN(num) || num <= 0) return `${label} must be a positive number`;
  return null;
};

const isType = (val) =>
  required("Type")(val) ||
  (["income", "expense"].includes(val) ? null : "Type must be income or expense");

// date must be in YYYY-MM-DD format
const isDateString = (val) => {
  if (!val) return "Date is required";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return "Date must be in YYYY-MM-DD format";
  if (isNaN(Date.parse(val))) return "Invalid date";
  return null;
};

const minLength = (label, len) => (val) =>
  required(label)(val) ||
  (String(val).trim().length >= len ? null : `${label} must be at least ${len} characters`);

// schemas used per route

const registerSchema = {
  name: required("Name"),
  email: isEmail,
  password: minLength("Password", 6),
  role: isRole,
};

const loginSchema = {
  email: isEmail,
  password: required("Password"),
};

const createRecordSchema = {
  amount: isPositiveNumber("Amount"),
  type: isType,
  category: required("Category"),
  date: isDateString,
};

// for updates, fields are optional - only validate if they are present
const updateRecordSchema = {
  amount: (val) => (val !== undefined ? isPositiveNumber("Amount")(val) : null),
  type: (val) => (val !== undefined ? isType(val) : null),
  date: (val) => (val !== undefined ? isDateString(val) : null),
};

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createRecordSchema,
  updateRecordSchema,
  isStatus,
  isRole,
};

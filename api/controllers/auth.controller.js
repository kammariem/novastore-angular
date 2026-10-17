const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const registerFields = new Set(['name', 'email', 'password', 'phone', 'address']);

class RequestValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
    this.code = 'INVALID_REQUEST';
  }
}

function validateBody(body, allowedFields) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new RequestValidationError('A JSON object is required.');
  }

  for (const field of Object.keys(body)) {
    if (!allowedFields.has(field)) {
      throw new RequestValidationError(`Field "${field}" is not supported.`);
    }
  }
}

function requiredText(value, field, maximum) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > maximum) {
    throw new RequestValidationError(`Field "${field}" is required and must not exceed ${maximum} characters.`);
  }
  return value.trim();
}

function optionalText(value, field, maximum) {
  if (value == null || value === '') return '';
  if (typeof value !== 'string' || value.trim().length > maximum) {
    throw new RequestValidationError(`Field "${field}" must not exceed ${maximum} characters.`);
  }
  return value.trim();
}

function validateEmail(value) {
  const email = requiredText(value, 'email', 254).toLowerCase();
  if (!emailPattern.test(email)) {
    throw new RequestValidationError('A valid email address is required.');
  }
  return email;
}

function validatePassword(value) {
  if (
    typeof value !== 'string' ||
    value.length < 12 ||
    Buffer.byteLength(value, 'utf8') > 72
  ) {
    throw new RequestValidationError('Password must contain at least 12 characters and no more than 72 UTF-8 bytes.');
  }
  return value;
}

function validateLoginPassword(value) {
  if (typeof value !== 'string' || value.length === 0 || Buffer.byteLength(value, 'utf8') > 72) {
    throw new RequestValidationError('A password is required.');
  }
  return value;
}

function createAuthController(service) {
  return {
    register: async (req, res) => {
      validateBody(req.body, registerFields);
      const result = await service.register({
        name: requiredText(req.body.name, 'name', 100),
        email: validateEmail(req.body.email),
        password: validatePassword(req.body.password),
        phone: optionalText(req.body.phone, 'phone', 40),
        address: optionalText(req.body.address, 'address', 500)
      });
      res.status(201).json(result);
    },

    login: async (req, res) => {
      validateBody(req.body, new Set(['email', 'password']));
      const result = await service.login({
        email: validateEmail(req.body.email),
        password: validateLoginPassword(req.body.password)
      });
      res.json(result);
    },

    currentUser: (req, res) => {
      const { active, ...user } = req.authUser;
      res.json(user);
    }
  };
}

module.exports = { createAuthController };

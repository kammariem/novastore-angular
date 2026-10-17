function createUserController(prisma) {
  return {
    list: async (req, res) => {
      const users = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          active: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      res.json(users);
    },

    update: async (req, res) => {
      const id = req.params.id;
      if (!id || id.length > 128 || id.includes('/')) {
        const error = new Error('User id is invalid.');
        error.status = 400;
        throw error;
      }
      const body = req.body;
      const allowed = new Set(['name', 'phone', 'address', 'active']);
      if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length === 0) {
        const error = new Error('At least one user field is required.');
        error.status = 400;
        throw error;
      }
      for (const key of Object.keys(body)) {
        if (!allowed.has(key)) {
          const error = new Error(`Field "${key}" is not supported.`);
          error.status = 400;
          throw error;
        }
      }
      const data = {};
      if (body.name !== undefined) {
        if (typeof body.name !== 'string' || !body.name.trim() || body.name.trim().length > 100) {
          const error = new Error('Field "name" is invalid.');
          error.status = 400;
          throw error;
        }
        data.name = body.name.trim();
      }
      for (const field of ['phone', 'address']) {
        if (body[field] !== undefined) {
          if (typeof body[field] !== 'string' || body[field].length > (field === 'phone' ? 40 : 500)) {
            const error = new Error(`Field "${field}" is invalid.`);
            error.status = 400;
            throw error;
          }
          data[field] = body[field].trim() || null;
        }
      }
      if (body.active !== undefined) {
        if (typeof body.active !== 'boolean') {
          const error = new Error('Field "active" must be a boolean.');
          error.status = 400;
          throw error;
        }
        data.active = body.active;
      }
      const user = await prisma.user.update({
        where: { id, role: 'CLIENT' },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          address: true,
          active: true,
          createdAt: true
        }
      });
      res.json(user);
    },

    deactivate: async (req, res) => {
      const id = req.params.id;
      const user = await prisma.user.update({
        where: { id, role: 'CLIENT' },
        data: { active: false },
        select: { id: true, active: true }
      });
      res.json(user);
    }
  };
}

module.exports = { createUserController };

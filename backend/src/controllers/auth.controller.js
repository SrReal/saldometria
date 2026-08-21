const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Entity } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_dev', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name, currency, invitationCode } = req.body;

    // Validación de Código de Invitación (Configurado en .env)
    const requiredInvitationCode = process.env.INVITATION_CODE;
    if (requiredInvitationCode && requiredInvitationCode.trim() !== '') {
      if (!invitationCode || invitationCode.trim() !== requiredInvitationCode.trim()) {
        return res.status(403).json({
          message: 'Código de invitación inválido o no proporcionado'
        });
      }
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const existingUser = await User.findOne({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        email: normalizedEmail,
        passwordHash,
        name: name ? name.trim() : null,
        currency: currency || 'EUR',
        entities: [
          {
            name: 'Personal',
            type: 'PERSONAL',
          },
        ],
      },
      {
        include: [{ model: Entity, as: 'entities' }],
      }
    );

    const token = generateToken(newUser.id);

    res.status(201).json({
      ok: true,
      token,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, currency: newUser.currency },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user.id);

    res.status(200).json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, name: user.name, currency: user.currency },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({
        ok: true,
        user: { id: user.id, email: user.email, name: user.name, currency: user.currency }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { email, newPassword, name, currency } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update Email
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existingUser = await User.findOne({ where: { email: normalizedEmail } });
        if (existingUser) {
          return res.status(409).json({ message: 'Email already in use' });
        }
        user.email = normalizedEmail;
      }
    }

    // Update Name
    if (name !== undefined) { 
        user.name = name ? name.trim() : null;
    }

    // Update Currency
    if (currency !== undefined) {
        user.currency = currency;
    }

    // Update Password
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long' });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (!email && !newPassword && name === undefined && currency === undefined) {
         return res.status(400).json({ message: 'No changes provided' });
    }

    await user.save();

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, currency: user.currency },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

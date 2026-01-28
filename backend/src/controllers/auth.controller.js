const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Entity } = require('../models');

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'secret_dev', {
    expiresIn: '7d', // Long expiration for personal app
  });
};

exports.register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        email,
        passwordHash,
        name: name || null,
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
      user: { id: newUser.id, email: newUser.email, name: newUser.name },
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

    const user = await User.findOne({ where: { email } });
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
      user: { id: user.id, email: user.email, name: user.name },
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
        user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { email, newPassword, name } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update Email
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: 'Email already in use' });
      }
      user.email = email;
    }

    // Update Name
    if (name !== undefined) { // Allow empty string to clear name if desired
        user.name = name;
    }

    // Update Password - No current password required as per user request
    if (newPassword) {
      user.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    if (!email && !newPassword && name === undefined) {
         return res.status(400).json({ message: 'No changes provided' });
    }

    await user.save();

    res.json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      message: 'Profile updated successfully'
    });

  } catch (error) {
    next(error);
  }
};

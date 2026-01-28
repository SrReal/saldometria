const { Entity } = require('../models');

exports.getAll = async (req, res, next) => {
  try {
    const entities = await Entity.findAll({
      where: { userId: req.user.id },
    });
    res.json(entities);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const entity = await Entity.create({
      name,
      type: type || 'PERSONAL', // Default to PERSONAL if not specified
      userId: req.user.id,
    });

    res.status(201).json(entity);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    // Entity is already attached by requireEntityOwnership middleware
    const { name } = req.body;
    const entity = req.entity;

    if (name) {
      entity.name = name;
    }

    await entity.save();
    res.json(entity);
  } catch (error) {
    next(error);
  }
};

exports.deleteEntity = async (req, res, next) => {
  try {
    const entity = req.entity;
    // Optional: Check if it's the last PERSONAL entity to prevent deleting the default one? 
    // keeping it simple for now.
    
    await entity.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

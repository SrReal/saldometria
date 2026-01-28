const { Category, Entity } = require('../models');

// Helper to check ownership via Entity
const verifyEntityOwnership = async (entityId, userId) => {
  const entity = await Entity.findByPk(entityId);
  return entity && entity.userId === userId;
};

exports.getAll = async (req, res, next) => {
  try {
    const { entityId } = req.query;

    if (!entityId) {
      return res.status(400).json({ message: 'entityId query parameter is required' });
    }

    if (!(await verifyEntityOwnership(entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized for this entity' });
    }

    const categories = await Category.findAll({
      where: { entityId },
      order: [['name', 'ASC']],
    });

    res.json(categories);
  } catch (error) {
    next(error);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { name, type, entityId } = req.body;

    if (!name || !type || !entityId) {
      return res.status(400).json({ message: 'Name, type, and entityId are required' });
    }

    if (!(await verifyEntityOwnership(entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized for this entity' });
    }

    const category = await Category.create({ name, type, entityId });
    res.status(201).json(category);
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!(await verifyEntityOwnership(category.entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (name) category.name = name;
    if (type) category.type = type;

    await category.save();
    res.json(category);
  } catch (error) {
    next(error);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (!(await verifyEntityOwnership(category.entityId, req.user.id))) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await category.destroy();
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

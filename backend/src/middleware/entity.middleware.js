const { Entity } = require('../models');

exports.requireEntityOwnership = async (req, res, next) => {
  try {
    const { id } = req.params; // Entity ID from URL params usually
    // Also check if entityId is in body for some requests if needed, but usually strictly by param for operations on specific entity
    
    if (!id) { 
        // If no ID in params, maybe this middleware is used incorrectly or for broader checks. 
        // For now, assume it's used on routes like /:id
        return next();
    }

    const entity = await Entity.findByPk(id);

    if (!entity) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    if (entity.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this entity' });
    }

    req.entity = entity; // Attach entity to request for convenience
    next();
  } catch (error) {
    next(error);
  }
};

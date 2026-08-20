const bcrypt = require('bcryptjs');
const { User } = require('../src/models');

async function resetPassword() {
  const email = 'teon.me@gmail.com'.toLowerCase().trim();
  const newPassword = 'Password123!';
  
  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.log(`Usuario no encontrado con email: ${email}`);
    const allUsers = await User.findAll({ attributes: ['id', 'email', 'name'] });
    console.log('Usuarios existentes en la base de datos:');
    allUsers.forEach(u => console.log(`- ID: ${u.id}, Email: ${u.email}, Nombre: ${u.name}`));
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  user.passwordHash = passwordHash;
  await user.save();

  console.log('SUCCESS');
  console.log(`Email: ${email}`);
  console.log(`Nueva contraseña: ${newPassword}`);
  process.exit(0);
}

resetPassword().catch(err => {
  console.error('Error al resetear contraseña:', err.message);
  process.exit(1);
});

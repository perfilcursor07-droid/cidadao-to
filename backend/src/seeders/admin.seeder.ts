import bcrypt from 'bcrypt';
import User from '../models/User';

export async function seedAdmin() {
  const email = 'admin@cidadao.to';
  const exists = await User.findOne({ where: { email } });
  if (exists) {
    console.log('Admin já existe.');
    return;
  }

  const password_hash = await bcrypt.hash('admin123', 10);
  await User.create({
    name: 'Administrador',
    email,
    password_hash,
    role: 'admin',
    city: 'Palmas',
    verified: true,
  });
  console.log('Admin criado: admin@cidadao.to / admin123');
}

import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import User from '../models/User';
import { AuthRequest } from '../middlewares/auth.middleware';

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email().max(150),
  password: z.string().min(6),
  cpf: z.string().max(14).optional(),
  city: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const exists = await User.findOne({ where: { email: data.email } });
  if (exists) return res.status(409).json({ error: 'Email já cadastrado', code: 'EMAIL_EXISTS' });

  const password_hash = await bcrypt.hash(data.password, 10);
  const user = await User.create({ name: data.name, email: data.email, password_hash, cpf: data.cpf || null, city: data.city || null });

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  res.status(201).json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
}

export async function login(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);
  const user = await User.findOne({ where: { email: data.email } });
  if (!user) return res.status(401).json({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });

  const valid = await bcrypt.compare(data.password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Credenciais inválidas', code: 'INVALID_CREDENTIALS' });

  const token = jwt.sign({ id: user.id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as any });
  res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
}

export async function me(req: AuthRequest, res: Response) {
  const user = req.user!;
  res.json({ id: user.id, name: user.name, email: user.email, role: user.role, city: user.city, verified: user.verified });
}

export async function logout(_req: Request, res: Response) {
  res.json({ message: 'Logout realizado com sucesso' });
}

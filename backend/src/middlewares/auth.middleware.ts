import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import User from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido', code: 'NO_TOKEN' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.JWT_SECRET) as { id: number };
    const user = await User.findByPk(payload.id);
    if (!user) return res.status(401).json({ error: 'Usuário não encontrado', code: 'USER_NOT_FOUND' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido', code: 'INVALID_TOKEN' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado', code: 'FORBIDDEN' });
    }
    next();
  };
}

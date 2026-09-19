import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';
import { IUserPayload } from '../types';

export function generateToken(payload: IUserPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): IUserPayload {
  return jwt.verify(token, env.JWT_SECRET) as IUserPayload;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

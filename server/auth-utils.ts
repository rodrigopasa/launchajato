/**
 * Utilitários de autenticação
 */
import crypto from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(crypto.scrypt);

/**
 * Gera um hash para a senha fornecida.
 * Utilizamos scrypt com salt para maior segurança.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado.
 */
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  try {
    const [storedHash, salt] = hashedPassword.split('.');
    if (!storedHash || !salt) {
      // Se o formato do hash armazenado for inválido (não contém salt),
      // isso pode acontecer em senhas antigas não-seguras, faça uma comparação direta
      // como fallback, embora isso não seja recomendado
      return plainPassword === hashedPassword;
    }
    
    const storedHashBuf = Buffer.from(storedHash, 'hex');
    const derivedKey = (await scryptAsync(plainPassword, salt, 64)) as Buffer;
    
    // Comparação em tempo constante para prevenir ataques de tempo
    return crypto.timingSafeEqual(storedHashBuf, derivedKey);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}
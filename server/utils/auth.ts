import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

// Número de rondas de "salt" para bcrypt (a mayor valor, más seguro pero más lento)
// bcrypt le añade a cada contraseña un trozo aleatorio distinto, así, en la base de datos
// no salen dos textos iguales. Si alguien roba la base de datos, no puede saber quién usa la misma contraseña ni buscarla en una lista de contraseñas comunes.
const SALT_ROUNDS = 10

// Estructura de los datos que se guardan dentro del token JWT
export interface JwtPayload {
  id: number
  email: string
  role: string
}

// Genera un hash seguro a partir de una contraseña en texto plano
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

// Compara una contraseña introducida con el hash guardado en la base de datos
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// Crea y firma un token JWT con caducidad de 7 días
export function signToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET

  // Falla con error 500 si el servidor no tiene configurada la clave secreta
  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET no configurado en el servidor' })
  }

  return jwt.sign(payload, secret, { expiresIn: '7d' })
}

// Comprueba que la petición incluye un JWT válido en la cabecera "Authorization: Bearer <token>"
export function requireAuth(event: H3Event): JwtPayload {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw createError({ statusCode: 500, statusMessage: 'JWT_SECRET no configurado en el servidor' })
  }

  // Lee la cabecera Authorization de la petición entrante
  const authHeader = getHeader(event, 'authorization')

  // Si no existe o no empieza por "Bearer ", rechaza la petición con 401 (No autorizado)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado: token no proporcionado' })
  }

  // Extrae el token quitando los primeros 7 caracteres ("Bearer ")
  const token = authHeader.slice(7)

  try {
    // Verifica la firma y caducidad del token y devuelve su contenido tipado
    return jwt.verify(token, secret) as JwtPayload
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'No autorizado: token inválido o expirado' })
  }
}
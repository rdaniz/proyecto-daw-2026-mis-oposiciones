import { db } from '../../../prisma/db'
import { signToken, verifyPassword } from '../../utils/auth'

/*defineEventHandler es la función principal para crear un manejador de peticiones HTTP (event handler) en el backend en Nuxt.
Cuando se crea un archivo dentro de server/api/ o server/routes/ en Nuxt se exporta por defecto el resultado de defineEventHandler(async (event) => { ... }). */

export default defineEventHandler(async (event) => {
  // Lee el email y la contraseña enviados en la petición POST
  const body = await readBody(event)
  const { email, password } = body || {}

  // Comprueba que no vengan vacíos

  /* throw createError(...) lanza una excepción y corta inmediatamente la ejecución normal de la función en ese punto.
     Cuando JavaScript/TypeScript ejecuta throw, se interrumpe el flujo de defineEventHandler
     (no se ejecutan las validaciones posteriores, ni signToken, ni el return) y la excepción sube
     hasta que Nitro la captura y devuelve la respuesta HTTP correspondiente. */

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Debes indicar email y contraseña'
    })
  }

  // Normaliza el email para la consulta
  const emailNormalizado = String(email).trim().toLowerCase()

  // Accede a la colección de usuarios en el esquema public
  const usuariosCol = db.orm.public?.usuarios
  if (!usuariosCol) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo acceder a la colección de usuarios'
    })
  }

  // Busca el usuario por email
  const usuario = await usuariosCol
    .where({ email: emailNormalizado })
    .first()

  // Si no existe, responde con HTTP 401
  if (!usuario) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas'
    })
  }

  // Verifica la contraseña contra el hash almacenado
  const passwordValida = await verifyPassword(String(password), usuario.password_hash)

  // Si no coincide, responde con HTTP 401 (prueba PR-02)
  if (!passwordValida) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales inválidas'
    })
  }

  // Genera el token JWT firmado con los datos esenciales del usuario
  const token = signToken({
    id: usuario.id,
    email: usuario.email,
    role: usuario.role
  })

  // Devuelve el token y los datos básicos del usuario
  return {
    token,
    user: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido_1: usuario.apellido_1,
      apellido_2: usuario.apellido_2,
      role: usuario.role
    }
  }
})
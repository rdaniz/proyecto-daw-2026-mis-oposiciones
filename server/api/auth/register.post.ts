import { db } from '../../../prisma/db'
import { hashPassword } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  // Lee el cuerpo JSON enviado en la petición POST
  const body = await readBody(event)
  const { email, password, nombre, apellido_1, apellido_2 } = body || {}

  // Valida que estén presentes todos los campos obligatorios
  if (!email || !password || !nombre || !apellido_1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Faltan campos obligatorios (email, password, nombre, apellido_1)'
    })
  }

  // Normaliza el email para evitar duplicados por mayúsculas o espacios
  const emailNormalizado = String(email).trim().toLowerCase()

  // Accede a la colección de usuarios en el esquema public
  const usuariosCol = db.orm.public?.usuarios
  if (!usuariosCol) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo acceder a la colección de usuarios'
    })
  }

  // Comprueba si ya existe un usuario con ese correo
  const existente = await usuariosCol
    .where({ email: emailNormalizado })
    .first()

  // Si ya existe, rechaza con HTTP 400 (prueba PR-01)
  if (existente) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El correo electrónico ya está registrado'
    })
  }

  // Cifra la contraseña con bcrypt antes de persistir
  const passwordHash = await hashPassword(String(password))

  // Inserta el nuevo usuario pasando los campos directamente a .create()
  const nuevoUsuario = await usuariosCol.create({
    email: emailNormalizado,
    password_hash: passwordHash,
    nombre: String(nombre).trim(),
    apellido_1: String(apellido_1).trim(),
    apellido_2: apellido_2 ? String(apellido_2).trim() : null,
    role: 'user'
  })

  // Devuelve los datos del usuario sin exponer password_hash
  return {
    id: nuevoUsuario.id,
    email: nuevoUsuario.email,
    nombre: nuevoUsuario.nombre,
    apellido_1: nuevoUsuario.apellido_1,
    apellido_2: nuevoUsuario.apellido_2,
    role: nuevoUsuario.role
  }
})
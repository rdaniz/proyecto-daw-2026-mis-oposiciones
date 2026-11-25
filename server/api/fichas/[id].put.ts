import { db } from '../../../prisma/db'
import { requireAuth } from '../../utils/auth'

// Editar una ficha concreta por su id, solo si pertenece al usuario autenticado o si el usuario es admin

/* Manejador HTTP para PUT /api/fichas/:id.
   Actualiza título, URL o descripción de una ficha tras validar datos y permisos. */
export default defineEventHandler(async (event) => {
  // Verifica la sesión mediante JWT
  const authUser = requireAuth(event)

  // Lee y valida el parámetro dinámico "id"
  const idParam = getRouterParam(event, 'id')
  const fichaId = Number(idParam)
  if (!idParam || !Number.isInteger(fichaId) || fichaId <= 0) {
    throw createError({
      statusCode: 400,
      statusMessage: 'El identificador de la ficha no es válido'
    })
  }

  // Lee los datos enviados en el cuerpo JSON
  const body = await readBody(event)
  const { titulo, url, descripcion } = body || {}

  // Comprueba que título y URL existan y no estén vacíos
  if (!titulo || !String(titulo).trim() || !url || !String(url).trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Debes indicar el título y la URL de la convocatoria'
    })
  }

  const tituloLimpio = String(titulo).trim()
  const urlLimpia = String(url).trim()
  const descripcionLimpia = descripcion && String(descripcion).trim()
    ? String(descripcion).trim()
    : null

  // Valida que la URL empiece por http:// o https://
  if (!/^https?:\/\//i.test(urlLimpia)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'La URL debe comenzar por http:// o https://'
    })
  }

  // Accede a la colección de fichas en el esquema public
  const fichasCol = db.orm.public?.fichas
  if (!fichasCol) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo acceder a la colección de fichas'
    })
  }

  // Comprueba que la ficha exista
  const fichaExistente = await fichasCol.where({ id: fichaId }).first()
  if (!fichaExistente) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ficha no encontrada'
    })
  }

  // Solo el propietario o un administrador pueden editar la ficha
  if (fichaExistente.usuario_id !== authUser.id && authUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para modificar esta ficha'
    })
  }

  // Actualiza los campos editables en PostgreSQL
  const fichaActualizada = await fichasCol
    .where({ id: fichaId })
    .update({
      titulo: tituloLimpio,
      url: urlLimpia,
      descripcion: descripcionLimpia
    })

  return {
    ficha: fichaActualizada
  }
})
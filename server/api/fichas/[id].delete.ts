import { db } from '../../../prisma/db'
import { requireAuth } from '../../utils/auth'

// Eliminar una ficha concreta por su id, solo si pertenece al usuario autenticado o si el usuario es admin

/* Manejador HTTP para DELETE /api/fichas/:id.
   Elimina la ficha y, por configuración relacional en cascada (onDelete: Cascade),
   también borra sus revisiones asociadas en PostgreSQL. */
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

  // Accede a la colección de fichas en el esquema public
  const fichasCol = db.orm.public?.fichas
  if (!fichasCol) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo acceder a la colección de fichas'
    })
  }

  // Comprueba que la ficha exista antes de intentar borrarla
  const fichaExistente = await fichasCol.where({ id: fichaId }).first()
  if (!fichaExistente) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ficha no encontrada'
    })
  }

  // Solo el propietario o un administrador pueden eliminar la ficha
  if (fichaExistente.usuario_id !== authUser.id && authUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para eliminar esta ficha'
    })
  }

  // Elimina la ficha en PostgreSQL
  await fichasCol.where({ id: fichaId }).delete()

  return {
    deleted: true,
    id: fichaId
  }
})
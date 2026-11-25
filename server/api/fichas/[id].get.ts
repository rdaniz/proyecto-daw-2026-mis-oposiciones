import { db } from '../../../prisma/db'
import { requireAuth } from '../../utils/auth'

// Consultar una ficha concreta por su id, solo si pertenece al usuario autenticado o si el usuario es admin

/* Manejador HTTP para GET /api/fichas/:id.
   Devuelve el detalle de una ficha concreta si pertenece al usuario o si su rol es admin. */
export default defineEventHandler(async (event) => {
  // Verifica la sesión mediante el token JWT en la cabecera Authorization
  const authUser = requireAuth(event)

  // Lee y valida que el parámetro dinámico "id" sea un número entero positivo
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

  // Busca la ficha por su identificador
  const ficha = await fichasCol.where({ id: fichaId }).first()
  if (!ficha) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ficha no encontrada'
    })
  }

  // Control de roles y propiedad: un usuario "user" solo puede ver sus fichas; "admin" ve cualquiera
  if (ficha.usuario_id !== authUser.id && authUser.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'No tienes permiso para acceder a esta ficha'
    })
  }

  return {
    ficha
  }
})
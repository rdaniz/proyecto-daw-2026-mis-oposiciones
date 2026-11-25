import { db } from '../../../prisma/db'
import { requireAuth } from '../../utils/auth'

/* defineEventHandler crea el manejador HTTP para GET /api/fichas.
   Al estar nombrado como index.get.ts dentro de server/api/fichas/,
   Nuxt lo asocia automáticamente a peticiones GET sobre /api/fichas. */
export default defineEventHandler(async (event) => {
  // Verifica el token JWT de la cabecera Authorization.
  // Si no hay token o es inválido, requireAuth lanza HTTP 401 y corta la ejecución del manejador.
  const authUser = requireAuth(event)

  // Accede a la colección de fichas en el esquema public
  const fichasCol = db.orm.public?.fichas
  if (!fichasCol) {
    throw createError({
      statusCode: 500,
      statusMessage: 'No se pudo acceder a la colección de fichas'
    })
  }

  // Control de roles:
  // - Si el usuario tiene rol "admin", obtiene todas las fichas del sistema (supervisión global).
  // - Si tiene rol "user", filtra estrictamente por su propio usuario_id.
  const fichas = authUser.role === 'admin'
    ? await fichasCol.all()
    : await fichasCol.where({ usuario_id: authUser.id }).all()
    

  return {
    fichas
  }
})
import { db } from '../../../prisma/db'
import { requireAuth } from '../../utils/auth'

/* Manejador HTTP para POST /api/fichas.
   Permite a cualquier usuario autenticado registrar una nueva convocatoria en seguimiento. */
export default defineEventHandler(async (event) => {
  // Verifica la sesión del usuario mediante JWT y extrae su id y rol
  const authUser = requireAuth(event)

  // Lee los datos enviados en el cuerpo JSON de la petición
  const body = await readBody(event)
  const { titulo, url, descripcion } = body || {}

  // Comprueba que título y URL existan y no sean cadenas vacías
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

  // Valida que la URL tenga un esquema HTTP o HTTPS válido
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

  // Inserta la nueva ficha vinculada al usuario autenticado.
  // Se inicializa con estado "sin_cambios" y last_checked_at en null hasta su primera revisión.
  const nuevaFicha = await fichasCol.create({
    usuario_id: authUser.id,
    titulo: tituloLimpio,
    url: urlLimpia,
    descripcion: descripcionLimpia,
    estado: 'sin_cambios',
    last_checked_at: null
  })

  return {
    ficha: nuevaFicha
  }
})
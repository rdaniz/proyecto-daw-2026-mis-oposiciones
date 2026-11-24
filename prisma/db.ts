// Carga las variables de entorno desde el archivo .env
import 'dotenv/config'
// Runtime de Prisma para PostgreSQL
import postgres from '@prisma/orm-postgres/runtime'
// Utilidad para construir el contrato tipado a partir del JSON generado
import { contractFromJson } from '@prisma/orm-postgres/static'
// Tipos generados del esquema (en la carpeta prisma/ se llaman schema.d.ts y schema.json)
import type { Contract } from './schema.d.js'
import contractJson from './schema.json' with { type: 'json' }

// Compila la definición del contrato tipado
export const contract = contractFromJson<Contract>(contractJson)

// Inicializa y exporta el cliente de base de datos conectado a DATABASE_URL
export const db = postgres({
  contract,
  url: process.env['DATABASE_URL']!,
})
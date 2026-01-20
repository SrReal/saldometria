# ROADMAP — SaldoMetria (Node + React + Plaid, multi-entidad)

> Objetivo: construir una app personal robusta con **múltiples Entidades** (varias personales y/o varias empresariales) gestionadas con **un único login**, conexión bancaria vía **Plaid**, transacciones **BANK + CASH**, analítica y forecast.  
> Cada fase está dividida en **pasos pequeños** con **checklists** y **pruebas** tras cada paso.

---

## Convenciones
- **BANK**: transacciones importadas de Plaid
- **CASH**: transacciones manuales en efectivo
- **Entidad**: contenedor lógico (p. ej. “Personal Rubén”, “Empresa SL”, “Personal Pareja”, etc.)
- **Idempotente**: ejecutar sync varias veces no duplica

### Definición de “Done” (para cada paso)
- [ ] Implementado
- [ ] Probado (según checklist del paso)
- [ ] Revisado (sin regresiones en pasos previos)

---

## Fase 0 — Preparación del repositorio y entorno
### 0.1 Crear estructura de proyecto
- [ ] Crear repo `saldometria/` con carpetas `backend/` y `frontend/`
- [ ] Inicializar Git y añadir `.gitignore` (Node/React/Prisma/.env/logs)

**Pruebas**
- [ ] `git status` limpio (solo ficheros esperados)

### 0.2 Tooling de calidad (backend)
- [ ] Configurar ESLint + Prettier en `backend/`
- [ ] Scripts: `dev`, `lint`, `format`, `test`

**Pruebas**
- [ ] `npm run lint` sin errores
- [ ] `npm run format` aplica cambios

### 0.3 Tooling de calidad (frontend)
- [ ] Configurar ESLint + Prettier en `frontend/`
- [ ] Scripts: `dev`, `lint`, `format`, `test`

**Pruebas**
- [ ] `npm run lint` sin errores

### 0.4 PostgreSQL local
- [ ] Levantar PostgreSQL (Docker recomendado)
- [ ] Crear `backend/.env` con `DATABASE_URL`

**Pruebas**
- [ ] Conectar a la DB (psql o Prisma)

---

## Fase 1 — Backend base (API + DB) + autenticación
### 1.1 Inicializar Express
- [ ] Crear `backend/src/app.js` (Express)
- [ ] Middleware: JSON, CORS, request-id (opcional)
- [ ] Error handler estándar

**Pruebas**
- [ ] Servidor arranca en `PORT`

### 1.2 Endpoint Health
- [ ] `GET /api/health` → `{ ok: true }`

**Pruebas**
- [ ] Responde 200

### 1.3 Autenticación (modo personal)
> Recomendación: single-user con email/password y JWT.
- [ ] `POST /api/auth/login`
- [ ] (Opcional) `POST /api/auth/register` solo en dev
- [ ] Middleware `requireAuth`

**Pruebas**
- [ ] Login correcto devuelve JWT
- [ ] Login incorrecto devuelve 401
- [ ] Ruta protegida sin token devuelve 401

---

## Fase 2 — Modelo multi-entidad (varias personales y/o empresariales)
### 2.1 Prisma: modelos mínimos (sin Plaid aún)
- [ ] Crear `prisma/schema.prisma`
- [ ] Modelos:
  - [ ] `User`
  - [ ] `Entity` (muchas por usuario)
  - [ ] `Category`
  - [ ] `Transaction`
  - [ ] `SyncRun`
- [ ] `Entity` incluye:
  - [ ] `name` (string)
  - [ ] `type` (enum: PERSONAL | BUSINESS)
  - [ ] `userId`

**Pruebas**
- [ ] `prisma migrate dev` sin errores
- [ ] `prisma studio` muestra modelos

### 2.2 API: CRUD de Entidades
- [ ] `GET /api/entities` (lista)
- [ ] `POST /api/entities` (crear: name + type)
- [ ] `PATCH /api/entities/:id` (renombrar)
- [ ] `DELETE /api/entities/:id` (soft-delete recomendado)
- [ ] Validar ownership por `userId`

**Pruebas**
- [ ] Crear 2 entidades PERSONAL distintas
- [ ] Crear 1 entidad BUSINESS
- [ ] Listar y ver las 3
- [ ] Renombrar una
- [ ] Borrado: no debe permitir si hay datos (o debe hacer soft-delete y ocultar)

### 2.3 Regla de aislamiento por entidad (base)
- [ ] Añadir helper `assertEntityOwned(userId, entityId)`
- [ ] Aplicar en todas las rutas que reciban `entityId`

**Pruebas**
- [ ] Acceso con `entityId` inexistente → 404
- [ ] Acceso con `entityId` de otro usuario (si existe) → 404/403

---

## Fase 3 — Categorías (por entidad) y transacciones CASH
### 3.1 Prisma: categorías por entidad
- [ ] `Category` con `entityId` (obligatorio)
- [ ] Índice: `(entityId, name)` único (evitar duplicados)

**Pruebas**
- [ ] Migración OK

### 3.2 API: CRUD categorías
- [ ] `GET /api/categories?entityId=...`
- [ ] `POST /api/categories` (entityId, name)
- [ ] `PATCH /api/categories/:id` (name)
- [ ] `DELETE /api/categories/:id` (soft-delete o restricción si está en uso)

**Pruebas**
- [ ] Crear categoría “Comida” en 2 entidades distintas (permitido)
- [ ] Crear “Comida” duplicada en la misma entidad (rechazado)

### 3.3 Prisma: transacciones unificadas (CASH listo)
- [ ] `Transaction` con:
  - [ ] `entityId` obligatorio
  - [ ] `accountId` nullable
  - [ ] `source` enum: BANK | CASH | MANUAL
  - [ ] `amount`, `date`, `description`

**Pruebas**
- [ ] Migración OK

### 3.4 API: crear CASH
- [ ] `POST /api/transactions/cash`:
  - required: `entityId`, `date`, `amount`, `description`
  - optional: `categoryId`
  - set: `source=CASH`, `accountId=null`
- [ ] Validaciones:
  - [ ] `amount != 0`
  - [ ] `categoryId` pertenece a la entidad

**Pruebas**
- [ ] Insertar gasto CASH negativo
- [ ] Insertar ingreso CASH positivo
- [ ] Rechazar `amount=0`
- [ ] Rechazar `categoryId` de otra entidad

### 3.5 API: listado y filtros
- [ ] `GET /api/transactions` con:
  - [ ] `entityId` (opcional)
  - [ ] `from`, `to`
  - [ ] `source`
  - [ ] `accountId`
  - [ ] paginación (`limit` + `cursor` recomendado)
- [ ] Regla:
  - [ ] Si `entityId` no se envía → lista global (todas las entidades del usuario)

**Pruebas**
- [ ] `entityId=X` devuelve solo esa entidad
- [ ] sin `entityId` devuelve mezcla de todas
- [ ] filtros `source=CASH` y rango fechas correctos

### 3.6 API: edición y borrado
- [ ] `PATCH /api/transactions/:id` (category/description/date/amount con límites)
- [ ] `DELETE /api/transactions/:id`

**Pruebas**
- [ ] Editar categoría y descripción
- [ ] Borrar y verificar que no aparece

---

## Fase 4 — Frontend React (MVP usable sin bancos)
### 4.1 Setup React (Vite)
- [ ] Crear proyecto con Vite
- [ ] Router y layout base
- [ ] Cliente API (fetch/axios) + manejo JWT

**Pruebas**
- [ ] Login y persistencia de sesión

### 4.2 Selector de Entidad (multi-entidad)
- [ ] Cargar entidades: `GET /api/entities`
- [ ] Selector en navbar:
  - [ ] “Todas”
  - [ ] Lista de entidades (nombre + badge PERSONAL/BUSINESS)
- [ ] Persistir selección (localStorage)

**Pruebas**
- [ ] Cambio de entidad actualiza pantallas
- [ ] “Todas” hace llamadas sin `entityId`

### 4.3 Pantalla: Movimientos
- [ ] Tabla de movimientos con filtros:
  - [ ] fechas
  - [ ] source (ALL/BANK/CASH)
  - [ ] entidad (si no usas selector global)
- [ ] Edición rápida de categoría

**Pruebas**
- [ ] Ver movimientos CASH creados
- [ ] Filtrar por fechas

### 4.4 Pantalla: Añadir CASH
- [ ] Formulario: entity, date, amount, category, description
- [ ] Validaciones UI

**Pruebas**
- [ ] Crear CASH y verlo inmediatamente

### 4.5 Pantalla: Dashboard (baseline)
- [ ] Cards: ingresos/gastos/ahorro del mes
- [ ] Gráfico por categorías

**Pruebas**
- [ ] Cambiar entidad recalcula
- [ ] Mes vacío muestra 0

---

## Fase 5 — Plaid: modelos y conexión bancaria por entidad
### 5.1 Prisma: modelos Plaid
- [ ] Añadir `BankConnection`:
  - [ ] `entityId` obligatorio
  - [ ] `plaidItemId`
  - [ ] `accessTokenEncrypted`
  - [ ] `institutionName`
  - [ ] `status`
- [ ] Añadir `Account`:
  - [ ] `entityId` obligatorio
  - [ ] `connectionId`
  - [ ] `providerAccountId` (Plaid `account_id`)
- [ ] Migración

**Pruebas**
- [ ] Migración OK

### 5.2 Servicio de cifrado
- [ ] Implementar `encrypt()` / `decrypt()` (AES-GCM u opción equivalente)
- [ ] Proteger `ENCRYPTION_KEY`

**Pruebas**
- [ ] Round-trip encrypt/decrypt devuelve el original
- [ ] Tokens nunca se guardan en claro

### 5.3 Endpoints Plaid Link
- [ ] `POST /api/plaid/link-token` (requiere `entityId`)
- [ ] `POST /api/plaid/exchange` (requiere `entityId`, `public_token`)
- [ ] Guardar conexión en la entidad correcta

**Pruebas (sandbox)**
- [ ] Conectar banco a una entidad PERSONAL
- [ ] Conectar banco a otra entidad BUSINESS
- [ ] Ver que quedan separadas

### 5.4 Importación de cuentas
- [ ] `plaidService.listAccounts(connection)`
- [ ] Upsert en `Account`

**Pruebas (sandbox)**
- [ ] Tras conectar, aparecen cuentas en UI (por entidad)

---

## Fase 6 — Sync BANK (idempotente) + botón manual
### 6.1 `syncService.run()` (núcleo)
- [ ] Parámetros: `{ userId, entityId? }`
- [ ] Lookback `SYNC_LOOKBACK_DAYS` (default 90)
- [ ] Por conexión:
  - [ ] traer transacciones
  - [ ] mapear → `Transaction` unificada (BANK)
  - [ ] upsert por unique `(entityId, provider, externalId)`
- [ ] Guardar `SyncRun`

**Pruebas (sandbox)**
- [ ] Primer sync importa N
- [ ] Segundo sync (mismo rango) importa 0 (idempotencia)
- [ ] Sync por entityId no toca otras entidades

### 6.2 Lock anti-ejecución simultánea
- [ ] Lock en memoria (suficiente para 1 instancia)
- [ ] Responder 409 si ya está corriendo

**Pruebas**
- [ ] Doble click “Sync” → 2ª petición 409

### 6.3 Endpoint manual
- [ ] `POST /api/sync/run` con `entityId` opcional
- [ ] Respuesta: `{ imported, skipped, ms }`

**Pruebas**
- [ ] Sync desde Postman

### 6.4 UI: Sync
- [ ] Botón “Sincronizar ahora”
- [ ] Mostrar “Última sync” por entidad y global

**Pruebas**
- [ ] Spinner, éxito y error
- [ ] Recarga de movimientos tras sync

---

## Fase 7 — Scheduler diario
### 7.1 Script CLI de sync
- [ ] `backend/scripts/sync.js` (lee env + args)
- [ ] Flags:
  - [ ] `--entityId=<id>`
  - [ ] sin args: sync global (todas las entidades)

**Pruebas**
- [ ] Ejecutar script manual (global)
- [ ] Ejecutar script con entityId

### 7.2 Cron sistema
- [ ] Crear entrada cron diaria 06:00
- [ ] Logar salida en fichero

**Pruebas**
- [ ] Simular cron ejecutándolo 2 veces: idempotente

---

## Fase 8 — Estadísticas (MVP)
### 8.1 Endpoints summary
- [ ] `GET /api/stats/summary?month=YYYY-MM&entityId=`
  - ingresos, gastos, ahorro

**Pruebas**
- [ ] Validar sumas con dataset pequeño

### 8.2 Series mensuales
- [ ] `GET /api/stats/monthly?year=YYYY&entityId=`

**Pruebas**
- [ ] Año con meses sin datos devuelve 0

### 8.3 Categorías
- [ ] `GET /api/stats/categories?month=YYYY-MM&entityId=`

**Pruebas**
- [ ] Comparar con sumas manuales

### 8.4 UI Dashboard (completo)
- [ ] Cards + gráfico categorías
- [ ] Selector de mes/año

**Pruebas**
- [ ] Cambio de mes/entidad recalcula

---

## Fase 9 — Reglas de categorización
### 9.1 CRUD Reglas (por entidad)
- [ ] `GET/POST/PATCH/DELETE /api/rules` con `entityId`

**Pruebas**
- [ ] Regla contiene “NETFLIX” → Suscripciones

### 9.2 Aplicación de reglas
- [ ] Aplicar al crear/importar transacciones
- [ ] Endpoint “reaplicar reglas” (opcional)

**Pruebas**
- [ ] Transacción importada entra con categoría correcta

---

## Fase 10 — Forecast (saldo recomendado)
### 10.1 Baseline (sin recurrentes)
- [ ] `GET /api/forecast?to=YYYY-MM-DD&entityId=`
- [ ] Algoritmo:
  - [ ] media gasto diario 60–90 días
  - [ ] margen seguridad (%)

**Pruebas**
- [ ] Casos controlados con dataset pequeño

### 10.2 Recurrentes básicos (mejora)
- [ ] Detectar periodicidad 28–35 días por merchant/descr
- [ ] Generar “upcoming bills”

**Pruebas**
- [ ] Detecta suscripción de prueba

---

## Fase 11 — Hardening y despliegue
### 11.1 Seguridad
- [ ] Confirmar cifrado tokens
- [ ] No logs de secretos

**Pruebas**
- [ ] Revisar DB: token no en claro

### 11.2 Observabilidad
- [ ] Logs estructurados
- [ ] Métricas básicas: tiempo sync, imported/skipped

**Pruebas**
- [ ] Ver `SyncRun` y logs consistentes

### 11.3 Tests automatizados
- [ ] Unit tests: stats, forecast, reglas
- [ ] Integration tests: auth/entities/transactions/sync

**Pruebas**
- [ ] `npm test` pasa

### 11.4 Despliegue personal
- [ ] Backend como servicio (systemd)
- [ ] Frontend build + Nginx
- [ ] HTTPS
- [ ] Backups Postgres

**Pruebas**
- [ ] Login OK
- [ ] Sync manual OK
- [ ] Cron diario ejecuta

---

## Checklist final (definición de éxito)
- [ ] Puedo crear **múltiples entidades** (PERSONAL/BUSINESS)
- [ ] Puedo conectar bancos por entidad
- [ ] Puedo ver movimientos por entidad y global
- [ ] Puedo añadir CASH por entidad
- [ ] Sync diario + botón manual
- [ ] Dashboard mensual + proyección básica
- [ ] Forecast de saldo recomendado por fecha


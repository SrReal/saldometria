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
- [ ] **Nota**: El usuario realiza los commits manualmente.

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

### 0.4 MySQL local
- [ ] Verificar MySQL corriendo en localhost
- [ ] Crear `backend/.env` con `DATABASE_URL` (mysql://...)

**Pruebas**
- [ ] Conectar a la DB (mysql command o Prisma)

---

## Fase 1 — Backend base (API + DB) + autenticación
### 1.1 Inicializar Express
- [x] Crear `backend/src/app.js` (Express)
- [x] Middleware: JSON, CORS, request-id (opcional)
- [x] Error handler estándar

**Pruebas**
- [x] Servidor arranca en `PORT`

### 1.2 Endpoint Health
- [x] `GET /api/health` → `{ ok: true }`

**Pruebas**
- [x] Responde 200

### 1.3 Autenticación (modo personal)
> Recomendación: single-user con email/password y JWT.
- [x] `POST /api/auth/login`
- [x] (Opcional) `POST /api/auth/register` solo en dev
- [x] Middleware `requireAuth`

**Pruebas**
- [x] Login correcto devuelve JWT
- [x] Login incorrecto devuelve 401
- [x] Ruta protegida sin token devuelve 401

---

## Fase 2 — Modelo multi-entidad (varias personales y/o empresariales)
### 2.1 Prisma: modelos mínimos (sin Plaid aún)
- [x] Crear `prisma/schema.prisma`
- [x] Modelos:
  - [x] `User`
  - [x] `Entity` (muchas por usuario)
  - [x] `Category`
  - [x] `Transaction`
  - [x] `SyncRun`
- [x] `Entity` incluye:
  - [x] `name` (string)
  - [x] `type` (enum: PERSONAL | BUSINESS)
  - [x] `userId`

**Pruebas**
- [x] `prisma migrate dev` sin errores
- [x] `prisma studio` muestra modelos

### 2.2 API: CRUD de Entidades
- [x] `GET /api/entities` (lista)
- [x] `POST /api/entities` (crear: name + type)
- [x] `PATCH /api/entities/:id` (renombrar)
- [x] `DELETE /api/entities/:id` (soft-delete recomendado)
- [x] Validar ownership por `userId`

**Pruebas**
- [x] Crear 2 entidades PERSONAL distintas
- [x] Crear 1 entidad BUSINESS
- [x] Listar y ver las 3
- [x] Renombrar una
- [x] Borrado: no debe permitir si hay datos (o debe hacer soft-delete y ocultar)

### 2.3 Regla de aislamiento por entidad (base)
- [x] Añadir helper `assertEntityOwned(userId, entityId)`
- [x] Aplicar en todas las rutas que reciban `entityId`

**Pruebas**
- [x] Acceso con `entityId` inexistente → 404
- [x] Acceso con `entityId` de otro usuario (si existe) → 404/403

---

## Fase 3 — Categorías (por entidad) y transacciones CASH
### 3.1 Prisma: categorías por entidad
- [x] `Category` con `entityId` (obligatorio)
- [x] Índice: `(entityId, name)` único (evitar duplicados)

**Pruebas**
- [x] Migración OK

### 3.2 API: CRUD categorías
- [x] `GET /api/categories?entityId=...`
- [x] `POST /api/categories` (entityId, name)
- [x] `PATCH /api/categories/:id` (name)
- [x] `DELETE /api/categories/:id` (soft-delete o restricción si está en uso)

**Pruebas**
- [x] Crear categoría “Comida” en 2 entidades distintas (permitido)
- [x] Crear “Comida” duplicada en la misma entidad (rechazado)

### 3.3 Prisma: transacciones unificadas (CASH listo)
- [x] `Transaction` con:
  - [x] `entityId` obligatorio
  - [x] `accountId` nullable
  - [x] `source` enum: BANK | CASH | MANUAL
  - [x] `amount`, `date`, `description`

**Pruebas**
- [x] Migración OK

### 3.4 API: crear CASH
- [x] `POST /api/transactions/cash`:
  - required: `entityId`, `date`, `amount`, `description`
  - optional: `categoryId`
  - set: `source=CASH`, `accountId=null`
- [x] Validaciones:
  - [x] `amount != 0`
  - [x] `categoryId` pertenece a la entidad

**Pruebas**
- [x] Insertar gasto CASH negativo
- [x] Insertar ingreso CASH positivo
- [x] Rechazar `amount=0`
- [x] Rechazar `categoryId` de otra entidad

### 3.5 API: listado y filtros
- [x] `GET /api/transactions` con:
  - [x] `entityId` (opcional)
  - [x] `from`, `to`
  - [x] `source`
  - [x] `accountId`
  - [x] paginación (`limit` + `cursor` recomendado)
- [x] Regla:
  - [x] Si `entityId` no se envía → lista global (todas las entidades del usuario)

**Pruebas**
- [x] `entityId=X` devuelve solo esa entidad
- [x] sin `entityId` devuelve mezcla de todas
- [x] filtros `source=CASH` y rango fechas correctos

### 3.6 API: edición y borrado
- [x] `PATCH /api/transactions/:id` (category/description/date/amount con límites)
- [x] `DELETE /api/transactions/:id`

**Pruebas**
- [x] Editar categoría y descripción
- [x] Borrar y verificar que no aparece

---

## Fase 4 — Frontend React (JS) (MVP usable sin bancos)
### 4.1 Setup React (Vite + JS)
- [x] Crear proyecto con Vite (template `react` standard, **NO TypeScript**)
- [x] Router y layout base
- [x] Cliente API (fetch/axios) + manejo JWT

**Pruebas**
- [x] Login y persistencia de sesión

### 4.2 Selector de Entidad (multi-entidad)
- [x] Cargar entidades: `GET /api/entities`
- [x] Selector en navbar:
  - [x] “Todas”
  - [x] Lista de entidades (nombre + badge PERSONAL/BUSINESS)
- [x] Persistir selección (localStorage)

**Pruebas**
- [x] Cambio de entidad actualiza pantallas
- [x] “Todas” hace llamadas sin `entityId`

### 4.3 Pantalla: Movimientos
- [x] Tabla de movimientos con filtros:
  - [x] fechas
  - [x] source (ALL/BANK/CASH)
  - [x] entidad (si no usas selector global)
- [x] Edición rápida de categoría

**Pruebas**
- [x] Ver movimientos CASH creados
- [x] Filtrar por fechas

### 4.4 Pantalla: Añadir CASH
- [x] Formulario: entity, date, amount, category, description
- [x] Validaciones UI

**Pruebas**
- [x] Crear CASH y verlo inmediatamente

### 4.5 Pantalla: Dashboard (baseline)
- [x] Cards: ingresos/gastos/ahorro del mes
- [x] Gráfico por categorías

**Pruebas**
- [x] Cambiar entidad recalcula
- [x] Mes vacío muestra 0

---

## Fase 5 — Importación Bancaria por CSV (Sustituye a Plaid temporalmente)
### 5.1 Prisma: modelos para Importación
- [x] `Transaction` (revisión):
  - [x] `source` = BANK (para lo que venga del CSV)
  - [x] `provider` = 'csv' (o el nombre del banco si lo detectamos)
- [x] `ImportLog` (sustituye o complementa a SyncRun):
  - [x] `filename`
  - [x] `status`
  - [x] `linesProcessed`, `imported`, `duplicates`

**Pruebas**
- [x] Migración OK

### 5.2 Arquitectura de "Adaptadores" CSV
- [x] Crear interfaz de parser (detectar banco por cabeceras o ver diferentes formatos)
- [x] Implementar un parser genérico o específico (ej. "Banco Estandar") que mapee columnas a `Transaction`.

**Pruebas**
- [x] Unit test: CSV string -> Array de objetos Transaction válidos

### 5.3 Endpoint de Carga (Upload)
- [x] `POST /api/import/upload` (multipart)
- [x] Recibe fichero + `entityId` + `accountId` (opcional, si el CSV es de una cuenta)
- [x] Procesa y devuelve resumen (N importados, M duplicados)

**Pruebas**
- [x] Subir CSV de prueba con Postman
- [x] Ver transacciones en DB

---

## Fase 6 — UI Importación y Gestión de duplicados
### 6.1 Pantalla de Importación
- [x] Formulario de subida de fichero (.csv)
- [x] Selector de Entidad
- [x] (Opcional) Selector de Cuenta destino (si aplica)
- [x] Mostrar resultados: "Se importaron X movimientos".

**Pruebas**
- [x] Subir fichero desde React
- [x] Feedback visual de éxito/error

### 6.2 Idempotencia (Deduplicación)
- [x] Lógica backend: comprobar si ya existe `Transaction` con misma fecha, importe y descripción (o hash generado) dentro de la entidad
- [x] Filtrar duplicados antes de insertar

**Pruebas**
- [x] Subir el mismo CSV dos veces -> 0 importados la segunda vez

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
- [x] `GET /api/stats/summary?month=YYYY-MM&entityId=`
  - ingresos, gastos, ahorro

**Pruebas**
- [x] Validar sumas con dataset pequeño

### 8.2 Series mensuales
- [x] `GET /api/stats/monthly?year=YYYY&entityId=`

**Pruebas**
- [x] Año con meses sin datos devuelve 0

### 8.3 Categorías
- [x] `GET /api/stats/categories?month=YYYY-MM&entityId=`

**Pruebas**
- [x] Comparar con sumas manuales

### 8.4 UI Dashboard (completo)
- [x] Cards + gráfico categorías
- [x] Selector de mes/año

**Pruebas**
- [x] Cambio de mes/entidad recalcula

---

## Fase 9 — Reglas de categorización
### 9.1 CRUD Reglas (por entidad)
- [x] `GET/POST/PATCH/DELETE /api/rules` con `entityId`

**Pruebas**
- [x] Regla contiene “NETFLIX” → Suscripciones

### 9.2 Aplicación de reglas
- [x] Aplicar al crear/importar transacciones
- [x] Endpoint “reaplicar reglas” (opcional)

**Pruebas**
- [x] Transacción importada entra con categoría correcta

---

## Fase 10 — Forecast (saldo recomendado)
### 10.1 Baseline (sin recurrentes)
- [x] `GET /api/stats/forecast` (calculado con media 90 días)
- [x] Algoritmo:
  - [x] media gasto diario 90 días
  - [ ] margen seguridad (%) (Pendiente de ajuste)

**Pruebas**
- [x] Casos controlados con dataset pequeño

### 10.2 Recurrentes básicos (mejora)
- [x] Detectar periodicidad 28–35 días por merchant/descr
- [x] Generar “upcoming bills”

**Pruebas**
- [x] Detecta suscripción de prueba

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
- [x] Unit tests: stats, forecast, reglas
- [ ] Integration tests: auth/entities/transactions/sync

**Pruebas**
- [x] `npm test` pasa

### 11.4 Despliegue personal
- [ ] Backend como servicio (systemd)
- [ ] Frontend build + Nginx
- [ ] HTTPS
- [ ] Backups MySQL

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


# SaldoMetria (personal) — Agregación bancaria + cash + previsión de saldo (Node + React + Plaid)

## 1. Objetivo del proyecto
**SaldoMetria** es una aplicación personal (uso privado) para:
- Conectar cuentas bancarias (varios bancos) mediante **Plaid**.
- Importar automáticamente **ingresos y gastos** (transacciones).
- Añadir **gastos/ingresos en efectivo** (cash) de forma manual.
- Visualizar:
  - Resumen mensual (ingresos, gastos, ahorro).
  - Evolución por categorías y comercios.
  - Proyección anual (“si sigues así…”).
  - **Previsión de saldo por fecha** (cuánto dinero debería haber disponible para cubrir gastos previstos).

### Requisito clave: multi-entidad con un solo login
Con un único usuario (login), el sistema debe permitir organizar la información por **Entidad** (tenancy lógico):
- **Entidad personal**: cuentas y movimientos particulares.
- **Entidad empresarial**: cuentas y movimientos de empresa.

La aplicación debe permitir:
- Ver datos **separados por banco/cuenta**.
- Ver datos **separados por entidad**.
- Ver una vista **global consolidada** (todo junto), con filtros.

Además, debe existir un proceso de sincronización:
- **Automático diario** (scheduler).
- **Manual desde la web** (botón “Sincronizar ahora”).

---

## 2. Alcance (MVP)
### 2.1 Funcionalidades incluidas
1) **Gestión de Entidades (mínimo)**
- Crear entidades (Personal / Empresarial).
- Asignar conexiones bancarias y transacciones a una entidad.
- Selector global en UI: “Entidad: Personal / Empresarial / Todas”.

2) **Conexión bancaria con Plaid (por entidad)**
- Link flow (conectar banco)
- Guardado de “items/connections” vinculados a una **entidad**
- Listado de cuentas por conexión

3) **Sincronización de transacciones**
- Proceso idempotente (no duplica)
- Deduplicación por `externalId`
- Sincronización por rango: últimos **60–90 días** (configurable) para absorber ajustes/correcciones del banco
- Sync por entidad (sincroniza todas las conexiones de una entidad, o todas las entidades)

4) **Transacciones manuales**
- Añadir gasto/ingreso en efectivo
- (Opcional) Añadir ajustes manuales
- Siempre asociadas a una entidad

5) **Dashboard y analítica básica**
- Totales por mes
- Ahorro mensual
- Gastos por categoría
- Filtros: entidad, “todas las cuentas”, por banco/cuenta, “cash”

6) **Previsión (versión MVP)**
- Basada en:
  - Promedios de gasto/ingreso recientes
  - Recurrentes simples (si se implementa)
- Objetivo: “Saldo recomendado en fecha X” con margen de seguridad

7) **Ejecución del Sync**
- Automático diario (cron del sistema o `node-cron`)
- Manual desde la web

---

## 3. Tecnología y lenguajes
### 3.1 Backend
- **Node.js** (LTS)
- **Express** (API REST)
- **Prisma ORM**
- **PostgreSQL** (recomendado por robustez y analítica)
- **Cron del sistema** (recomendado) o `node-cron` (alternativa)
- **JWT** para autenticación (o modo “single-user”)

### 3.2 Frontend
- **React**
- Vite (recomendado por simplicidad) o Next.js
- Cliente HTTP (fetch/Axios)
- Librería de gráficos (Recharts/Chart.js)

### 3.3 Integración bancaria
- **Plaid** (Link + Transactions; opcional Balance)

---

## 4. Arquitectura
### 4.1 Componentes
1) **Frontend React**
- UI: selector de entidad, dashboard, movimientos, cash manual, conexión bancos, botón de sync

2) **API Backend (Node/Express)**
- Autenticación
- Gestión de entidades
- Integración Plaid (crear link token, intercambiar tokens, sincronizar)
- CRUD de transacciones manuales
- Endpoints de estadísticas y previsión

3) **Base de datos (Postgres)**
- Persistencia: usuarios, entidades, conexiones, cuentas, transacciones, categorías, reglas, logs

4) **Scheduler**
- Diario: ejecuta `sync.run()` para una entidad o para todas

### 4.2 Principios clave
- **Idempotencia**: ejecutar sync varias veces no duplica datos.
- **Deduplicación**: índice único sobre las transacciones bancarias importadas.
- **Unificación**: banco + cash + manual terminan en la misma entidad `Transaction`.
- **Multi-entidad**: toda lectura/escritura debe estar filtrada por `entityId` (salvo vistas globales explícitas).

---

## 5. Modelo de datos (propuesto)
> Nombres orientativos. Se implementará con Prisma.

### 5.1 Entidades
#### `User`
- `id`
- `email`
- `passwordHash`
- `createdAt`

#### `Entity`
Representa un “contenedor” (Personal / Empresarial).
- `id`
- `userId`
- `name` (ej.: “Personal”, “Empresa”)
- `type` (PERSONAL / BUSINESS, opcional)
- `createdAt`

#### `BankConnection`
Representa una conexión Plaid (item), vinculada a una entidad.
- `id`
- `userId`
- `entityId`
- `provider` = "plaid"
- `plaidItemId`
- `accessTokenEncrypted` (cifrado)
- `institutionName`
- `status` (ACTIVE / NEEDS_REAUTH / DISABLED)
- `createdAt`, `updatedAt`

#### `Account`
Representa una cuenta real dentro de la conexión.
- `id`
- `userId`
- `entityId`
- `connectionId`
- `providerAccountId` (Plaid `account_id`)
- `name`
- `mask` (últimos dígitos si aplica)
- `type`, `subtype`
- `currency`
- `active`

#### `Transaction`
Unificación total (banco/cash/manual) y siempre vinculada a una entidad.
- `id`
- `userId`
- `entityId`
- `accountId` (nullable para cash/manual)
- `date`
- `amount` (positivo ingreso, negativo gasto)
- `description`
- `merchant` (si se obtiene)
- `categoryId` (nullable)
- `source` = BANK / CASH / MANUAL
- `externalId` (nullable; obligatorio si `source=BANK`)
- `provider` (nullable; "plaid" si BANK)
- `createdAt`

**Índices únicos recomendados**:
- Para BANK: `(userId, provider, externalId)`
- Alternativa (si prefieres acotar por entidad): `(entityId, provider, externalId)`

#### `Category`
- `id`
- `userId`
- `entityId` (si quieres categorías por entidad) **o** `entityId=null` para categorías compartidas
- `name`
- `createdAt`

#### `Rule` (opcional, pero muy útil)
- `id`
- `userId`
- `entityId`
- `matchText` (contiene/regex)
- `categoryId`

#### `SyncRun` (log del proceso)
- `id`
- `userId`
- `entityId` (nullable si el run fue “todas las entidades”)
- `startedAt`, `finishedAt`
- `status` (OK/ERROR)
- `importedCount`, `skippedCount`
- `notes` / `error`

---

## 6. Flujos principales
### 6.1 Selección de Entidad (UX base)
- En la cabecera (navbar): selector **Entidad**
  - Personal
  - Empresa
  - Todas
- El selector afecta a:
  - Dashboard
  - Movimientos
  - Estadísticas
  - Conexiones bancarias
  - Cash manual

### 6.2 Conectar un banco (Plaid Link) por entidad
1) Frontend solicita `POST /api/plaid/link-token` enviando `entityId`
2) Backend crea link token y lo devuelve
3) Frontend abre Plaid Link
4) Plaid devuelve `public_token`
5) Frontend llama `POST /api/plaid/exchange` con `public_token` + `entityId`
6) Backend intercambia y guarda `access_token` (cifrado) + metadata + entidad

### 6.3 Sincronizar transacciones
1) Se determina ámbito:
- una entidad concreta (`entityId`) o todas
2) Se listan conexiones activas en ese ámbito
3) Para cada conexión:
- se consultan cuentas
- se sincronizan transacciones para el rango (ej. últimos 90 días)
4) Se hace **upsert** en `Transaction` usando `externalId`
5) Se aplican reglas de categorización (si existen)
6) Se registra `SyncRun`

### 6.4 Añadir gasto/ingreso en efectivo
- Frontend: formulario (entidad, fecha, importe, categoría, descripción)
- Backend: `POST /api/transactions/cash`
- DB: `Transaction(source=CASH, accountId=null, entityId=...)`

### 6.5 Vista por bancos / global
Filtros típicos:
- Entidad: Personal / Empresa / Todas
- Banco (institución) / Conexión
- Cuenta
- Fuente: BANK / CASH / MANUAL

---

## 7. Endpoints (MVP)
### 7.1 Entidades
- `GET /api/entities`
- `POST /api/entities` (crear)
- `PATCH /api/entities/:id` (renombrar)

### 7.2 Plaid
- `POST /api/plaid/link-token` (requiere `entityId`)
- `POST /api/plaid/exchange` (requiere `entityId`)

### 7.3 Sync
- `POST /api/sync/run` (opcional `entityId`; si no se envía, sincroniza todas)
- `GET /api/sync/status?entityId=`
- `GET /api/sync/runs?limit=20&entityId=`

### 7.4 Transacciones
- `GET /api/transactions?from=&to=&entityId=&accountId=&source=`
- `POST /api/transactions/cash` (requiere `entityId`)
- `PATCH /api/transactions/:id` (editar categoría, descripción)
- `DELETE /api/transactions/:id`

### 7.5 Estadísticas / Forecast
- `GET /api/stats/summary?month=YYYY-MM&entityId=`
- `GET /api/stats/monthly?year=YYYY&entityId=`
- `GET /api/forecast?to=YYYY-MM-DD&entityId=`

---

## 8. Proceso diario (scheduler)
Se ofrece doble mecanismo:

1) **Cron del sistema (recomendado)**
- Ejecuta un script `node backend/scripts/sync.js` una vez al día (p. ej. 06:00).
- El script puede:
  - sincronizar todas las entidades
  - o una entidad concreta (parámetro)

2) **node-cron (alternativa)**
- El backend programa la tarea al arrancar.

Requisitos comunes:
- **Lock** para evitar doble ejecución simultánea.
- Registro en `SyncRun`.

---

## 9. Seguridad y privacidad (mínimos razonables)
- No se guardan credenciales bancarias.
- `access_token` de Plaid:
  - Guardado **cifrado en BD**.
  - Clave de cifrado fuera del repositorio (variable de entorno).
- HTTPS obligatorio en despliegue.
- Backups cifrados del Postgres.
- Logs sin datos sensibles (evitar tokens o payloads completos).

---

## 10. Configuración (variables de entorno)
Ejemplo `.env` (no subir a git):
- `NODE_ENV=production|development`
- `PORT=3001`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...` (si aplica)
- `PLAID_CLIENT_ID=...`
- `PLAID_SECRET=...`
- `PLAID_ENV=sandbox|development|production`
- `ENCRYPTION_KEY=...` (32 bytes base64)
- `SYNC_LOOKBACK_DAYS=90`

---

## 11. Estructura de repositorio (propuesta)
```
SaldoMetria/
  backend/
    src/
      app.js
      routes/
      services/
      jobs/
      db/
    prisma/
      schema.prisma
    scripts/
      sync.js
    package.json
  frontend/
    src/
      pages/
      components/
      api/
    package.json
  README.md
```

---

## 12. Roadmap sugerido (iterativo)
### Fase 1 — Base funcional + Entidades
- [ ] Backend Express + Prisma + Postgres
- [ ] CRUD de entidades (Personal/Empresa)
- [ ] CRUD de transacciones cash/manual (siempre con `entityId`)
- [ ] Dashboard con selector de entidad

### Fase 2 — Plaid por entidad
- [ ] Plaid Link: conectar institución (vinculado a una entidad)
- [ ] Guardado conexión + cuentas
- [ ] Sync inicial (90 días) + deduplicación
- [ ] Sync manual desde web

### Fase 3 — Automatización y calidad
- [ ] Cron diario + lock anti doble ejecución
- [ ] Logs `SyncRun` con ámbito (entidad / global)
- [ ] Motor de reglas de categorización
- [ ] Vistas: por banco/cuenta + global

### Fase 4 — Forecast (valor diferencial)
- [ ] Detección básica de recurrentes
- [ ] Saldo recomendado por fecha + margen
- [ ] Alertas simples (p. ej. “riesgo de saldo negativo”)

---

## 13. Necesidades previas
- Cuenta Plaid configurada (sandbox/producción según plan).
- Entorno local o servidor con:
  - Node.js LTS
  - PostgreSQL
- Dominio/HTTPS si se despliega fuera de local.

---

## 14. Notas de diseño sobre límites de llamadas (objetivo: low-usage)
Con un sync diario y pocas entidades:
- 31 ejecuciones/mes
- 2 entidades (personal/empresa)
- 1–2 bancos por entidad

Se debe optimizar el sync para minimizar llamadas:
- Cachear cuentas/institución cuando no cambie
- Traer transacciones por rangos eficientes
- Evitar llamadas de balance si no son imprescindibles

Objetivo operativo: mantenerse dentro de límites de llamadas mensuales (si aplica a tu plan).

---

## 15. Licencia
Uso personal. No orientado a redistribución pública (ajustar si se publica).


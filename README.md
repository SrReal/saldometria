# 💳 SaldoMetria — Control Financiero Inteligente & Multi-Entidad

<p align="center">
  <img src="frontend/public/vite.svg" alt="SaldoMetria Logo" width="90" height="90" />
</p>

<p align="center">
  <strong>Plataforma moderna de agregación, gestión financiera personal/empresarial y auto-categorización con Inteligencia Artificial.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-v18%2B-339933?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/TailwindCSS-v3-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/MySQL-Sequelize-4479A1?style=flat-square&logo=mysql&logoColor=white" alt="MySQL" />
  <img src="https://img.shields.io/badge/AI-Groq%20LLM-f55036?style=flat-square&logo=openai&logoColor=white" alt="Groq" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License" />
</p>

---

## 🌟 Características Principales

### 🏢 1. Aislamiento Multi-Entidad (Multi-Tenancy)
* Gestiona finanzas **personales**, **familiares** y de **empresas/proyectos** bajo una misma cuenta.
* Aislamiento estricto de transacciones, cuentas, presupuestos y reglas por entidad seleccionada.
* Cambio instantáneo de entidad desde el selector de la cabecera.

### 🤖 2. Auto-Categorización Inteligente con IA (Groq LLM)
* Clasificación automática de extractos bancarios usando modelos LLM ultrarrápidos (ej. `openai/gpt-oss-120b`, `llama-3.3`).
* **Creación Dinámica de Categorías:** Si la IA detecta movimientos que no encajan en las categorías existentes, crea automáticamente las categorías necesarias con colores personalizados.
* **Generación Automática de Reglas:** Extrae patrones de comercios recurrentes (ej. *Mercadona, Repsol, Amazon, AliExpress*) y genera reglas reutilizables.
* **Aplicación Retroactiva:** Aplica las nuevas reglas a todo el historial de movimientos pendientes al instante.

### ⚡ 3. Motor de Reglas Avanzado
* Tabla interactiva de gestión con búsqueda semántica en tiempo real.
* Filtros por Tipo (*Ingresos / Gastos*) y por Categoría asignada.
* Selección múltiple por checkboxes y **borrado masivo**.
* Activación/pausa de reglas sin eliminarlas.

### 📥 4. Importación Bancaria Inteligente (CSV / Excel)
* Importador modular con adaptadores para entidades bancarias (Banco Santander, extractos genéricos, etc.).
* **Detección inteligente de duplicados** por fecha, importe y tipo.
* Aplicación de reglas y auto-clasificación en el momento de la importación.

### 📊 5. Analítica & Previsión Financiera (Forecast)
* Dashboard interactivo con gráficos de evolución, ahorro mensual y distribución por categorías.
* **Calendario Financiero:** Visualización día a día de cobros, pagos y saldo disponible.
* **Metas de Ahorro:** Planificación de objetivos con barras de progreso y cálculo de aportaciones periódicas.
* **Presupuestos Mensuales:** Seguimiento de límites de gasto por categoría con barras de alerta.
* **Sistema de Alertas de Saldo:** Notificaciones ante riesgo de descubierto o saldos mínimos.

### 📱 6. Diseño 100% Responsive & Accesible
* Interfaz fluida para **móviles, tablets y pantallas de escritorio**.
* Menú móvil con navegación inferior (Bottom Bar) y cajón lateral táctil (Drawer).
* Internacionalización integrada (**Español** e **Inglés**).
* Alertas y diálogos estilizados con **SweetAlert2**.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnologías |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons, i18next, SweetAlert2, Axios |
| **Backend** | Node.js, Express 5, Sequelize ORM, Groq SDK, Winston Logger, Helmet CSP, Morgan, CORS |
| **Base de Datos** | MySQL 8.0+ / MariaDB |
| **Testing** | Jest, Supertest (100% Test Suites Passed) |

---

## 📂 Estructura del Proyecto

```text
saldrometria/
├── backend/                    # Servidor API REST
│   ├── src/
│   │   ├── config/             # Configuración de base de datos y logging
│   │   ├── controllers/        # Controladores (Auth, Transacciones, Reglas, IA, etc.)
│   │   ├── middleware/         # Autenticación JWT, Rate Limiting, Manejo de errores
│   │   ├── models/             # Modelos Sequelize (User, Entity, Account, Transaction, Rule, etc.)
│   │   ├── routes/             # Enrutamiento de la API (/api/...)
│   │   ├── services/           # Lógica de negocio (Groq AI, Importadores bancarios, etc.)
│   │   └── utils/              # Utilidades y Logger Winston
│   ├── tests/                  # Batería de pruebas automatizadas (Jest)
│   ├── .env.example            # Plantilla de variables de entorno del backend
│   └── package.json
│
├── frontend/                   # Cliente SPA React + Vite
│   ├── src/
│   │   ├── api/                # Cliente Axios con interceptores JWT
│   │   ├── components/         # Componentes UI reutilizables (Logo, Botones, Modales, etc.)
│   │   ├── context/            # Contextos de React (AuthContext, EntityContext)
│   │   ├── layouts/            # Layout responsivo con Sidebar y Navegación Móvil
│   │   ├── locales/            # Traducciones i18n (es.json, en.json)
│   │   ├── pages/              # Páginas (Dashboard, Transactions, Rules, Calendar, Goals, etc.)
│   │   └── utils/              # Helpers y SweetAlert2 modals
│   └── package.json
│
└── deploy/                     # Paquete compilado listo para desplegar en Plesk / Servidor
```

---

## 🚀 Instalación y Puesta en Marcha Local

### Prerrequisitos
* **Node.js** v18 o superior
* **MySQL** v8.0 o MariaDB
* *(Opcional)* API Key gratuita de [Groq Console](https://console.groq.com) para la categorización con IA.

### 1. Clonar el Repositorio
```bash
git clone https://github.com/SrReal/saldometria.git
cd saldometria
```

### 2. Configurar el Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales de base de datos y clave secreta:
```env
PORT=3000
NODE_ENV=development
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=saldometria_db
DB_USER=root
DB_PASSWORD=tu_password
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura
CORS_ORIGIN=http://localhost:5173

# Opcional: Groq AI
GROQ_API_KEY=gsk_tu_clave_de_groq
GROQ_MODEL=openai/gpt-oss-120b
```

Inicia el servidor en modo desarrollo:
```bash
npm run dev
```

### 3. Configurar el Frontend
En otra terminal:
```bash
cd frontend
npm install
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador para empezar.

---

## 🧪 Ejecución de Tests

El backend incluye una suite de pruebas automatizadas con **Jest** y **Supertest** para validar aislamiento de entidades, autenticación, cálculo de balances y salud de la base de datos:

```bash
cd backend
npm test
```

---

## 🌐 Despliegue en Producción (Plesk / Nginx / PM2)

El proyecto incluye la carpeta optimizada `deploy/` lista para producción:

1. **Compilar el frontend:**
   ```bash
   cd frontend
   npm run build
   ```
2. **Subir al servidor:** Sube el contenido de `backend/` (con la carpeta `frontend/dist` copiada dentro de `backend/public/`).
3. **Plesk Node.js:**
   * **Application Startup File:** `src/server.js`
   * **Application Mode:** `production`
   * Configura las variables de entorno en el panel y pulsa **"NPM Install"** y **"Restart"**.

---

## 🔒 Seguridad

* **Helmet CSP:** Configuración de cabeceras seguras con soporte para Content Security Policy.
* **Rate Limiting:** Protección anti brute-force en endpoints de autenticación y subida de ficheros.
* **Contraseñas:** Hashing criptográfico mediante `bcryptjs`.
* **Tokens:** Autenticación stateless segura con JSON Web Tokens (JWT).
* **Sanitización:** Consultas preparadas y parametrizadas para evitar inyección SQL (SQLi).

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Puedes usarlo, modificarlo y distribuirlo libremente. Consulta el archivo `LICENSE` para más detalles.

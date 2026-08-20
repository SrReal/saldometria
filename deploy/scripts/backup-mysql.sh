#!/bin/bash
# ==============================================================================
# Script de Copia de Seguridad Automática para SaldoMetria (MySQL)
# ==============================================================================
# Configurar en Crontab con:
# 0 3 * * * /var/www/saldometria/deploy/scripts/backup-mysql.sh >> /var/log/saldometria-backup.log 2>&1

set -e

# Configuración de base de datos
DB_NAME="saldometria_db"
DB_USER="saldometria_user"
DB_PASS="TU_PASSWORD_AQUI"
DB_HOST="127.0.0.1"

# Directorio de almacenamiento de backups
BACKUP_DIR="/var/backups/saldometria"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=14

# Crear directorio si no existe con permisos seguros (solo root/propietario)
mkdir -p "${BACKUP_DIR}"
chmod 700 "${BACKUP_DIR}"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Iniciando copia de seguridad de ${DB_NAME}..."

# Exportar y comprimir en streaming con gzip
mysqldump -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASS}" \
    --single-transaction \
    --quick \
    --routines \
    --triggers \
    "${DB_NAME}" | gzip -9 > "${BACKUP_FILE}"

chmod 600 "${BACKUP_FILE}"

FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Copia completada: ${BACKUP_FILE} (Tamaño: ${FILESIZE})"

# Limpieza y rotación: eliminar backups más antiguos que RETENTION_DAYS
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Eliminando copias de más de ${RETENTION_DAYS} días..."
find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Proceso de backup finalizado con éxito."

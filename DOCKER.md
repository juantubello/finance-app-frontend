# Guía de Docker para Producción

## 🚀 Inicio Rápido

1. **Crea el archivo `.env`** (copia de `.env.example`):
```bash
cp .env.example .env
```

2. **Edita `.env`** y configura el endpoint de tu backend:
```bash
NEXT_PUBLIC_API_BASE_URL=http://nombre-de-tu-backend:puerto
```

3. **Levanta el contenedor:**
```bash
docker-compose up --build
```

## Configuración del Endpoint del Backend

La aplicación necesita conocer la URL del backend API a través de la variable `NEXT_PUBLIC_API_BASE_URL` en el archivo `.env`.

### Ejemplos según tu escenario:

**Backend en otro contenedor Docker (misma red):**
```bash
NEXT_PUBLIC_API_BASE_URL=http://backend:3001
```
⚠️ Usa el **nombre del servicio** del backend (no `localhost` ni IP)

**Backend en el host (fuera de Docker):**
```bash
NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:3001
```

**Backend en producción:**
```bash
NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com
```

### Opción 2: Build manual con Docker

```bash
# Build con argumento de build
docker build \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://tu-backend:3001 \
  -t finance-frontend .

# Run
docker run -p 3005:3005 finance-frontend
```

### Opción 3: Variables de entorno en docker-compose.yml

Puedes editar directamente `docker-compose.yml` y cambiar:
```yaml
build:
  args:
    NEXT_PUBLIC_API_BASE_URL: http://tu-backend:3001
```

## Verificación

Una vez levantado el contenedor, verifica que:

1. El contenedor esté corriendo:
```bash
docker ps
```

2. Los logs no muestren errores:
```bash
docker-compose logs frontend
```

3. La aplicación responde:
```bash
curl http://localhost:3005
```

## Configuración de Red Docker

El `docker-compose.yml` crea automáticamente una red llamada `finance-network`.

**Para conectar tu backend a la misma red**, agrega esto en el `docker-compose.yml` de tu backend:

```yaml
services:
  tu-backend:  # <-- nombre de tu servicio backend
    # ... tu configuración ...
    networks:
      - finance-network

networks:
  finance-network:
    name: finance-network
    external: true
```

Luego levanta ambos servicios normalmente.

### Verificar conexión

Para verificar que ambos contenedores están en la misma red:
```bash
docker network inspect finance-network
```

Deberías ver ambos contenedores listados.

## ⚠️ Notas Importantes

- **IMPORTANTE**: `NEXT_PUBLIC_API_BASE_URL` debe configurarse en el **build time** (no en runtime) porque Next.js la incluye en el bundle del cliente.
- Si cambias la URL del backend en `.env`, necesitas **rebuild**:
  ```bash
  docker-compose build --no-cache
  docker-compose up
  ```
- El puerto por defecto es `3005`, pero puedes cambiarlo con la variable `PORT` en `.env`.
- **Para contenedores en la misma red**: Usa el nombre del servicio como hostname (ej: `http://backend:3001`), NO uses `localhost`.
- El archivo `.env` NO debe subirse a git (ya está en `.gitignore`).

## Troubleshooting

### El frontend no puede conectarse al backend

1. **Verifica que ambos contenedores estén en la misma red:**
   ```bash
   docker network inspect finance-network
   ```
   Deberías ver ambos contenedores listados.

2. **Verifica el nombre del servicio del backend:**
   ```bash
   docker ps
   ```
   El nombre que ves debe coincidir con el usado en `NEXT_PUBLIC_API_BASE_URL`.

3. **Prueba la conectividad desde el contenedor del frontend:**
   ```bash
   docker exec -it <nombre-contenedor-frontend> wget -O- http://backend:3001
   ```
   (Reemplaza `backend:3001` por tu configuración real)

4. **Verifica los logs:**
   ```bash
   docker-compose logs frontend
   ```

5. **Si usas el nombre del servicio pero no funciona:**
   - Asegúrate de que el backend esté levantado antes del frontend
   - O usa `depends_on` en docker-compose (aunque no garantiza que el servicio esté listo)
   - Verifica que el puerto del backend sea el correcto

### Error "Cannot find module" al iniciar

- Asegúrate de que `output: 'standalone'` esté en `next.config.mjs`
- Rebuild la imagen: `docker-compose build --no-cache`

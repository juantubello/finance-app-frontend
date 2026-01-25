# Docker - Guía Rápida

## 🚀 Inicio Rápido

1. **Edita el archivo `.env`** (ya está creado):
   - Abre `.env` y busca la línea: `NEXT_PUBLIC_API_BASE_URL=http://backend:3001`
   - 🔧 **REEMPLAZA** `backend:3001` por el nombre y puerto real de tu servicio backend
   - Ejemplo: Si tu servicio se llama `api` y corre en puerto `8080`: `http://api:8080`

2. **Levanta el contenedor:**
```bash
docker-compose up --build
```

¡Listo! El frontend estará corriendo en `http://localhost:3005`

## 📝 Dónde configurar

- **Archivo `.env`**: Línea `NEXT_PUBLIC_API_BASE_URL` - 🔧 Reemplaza el valor aquí
- **docker-compose.yml**: Ya está configurado para leer de `.env`
- **src/lib/api.ts**: Ya está configurado para usar la variable de entorno

## 📝 Configuración del Backend

### Si tu backend está en otro contenedor Docker:

En tu `.env`, usa el **nombre del servicio** del backend:
```bash
NEXT_PUBLIC_API_BASE_URL=http://backend:3001
```

**Importante:** 
- El nombre debe coincidir exactamente con el nombre del servicio en el `docker-compose.yml` del backend
- Usa el puerto **interno** del contenedor (no el mapeado al host)

### Si tu backend está en el host (fuera de Docker):

```bash
NEXT_PUBLIC_API_BASE_URL=http://host.docker.internal:3001
```

### Si tu backend está en producción:

```bash
NEXT_PUBLIC_API_BASE_URL=https://api.tudominio.com
```

## 🔧 Red Docker

El `docker-compose.yml` crea automáticamente una red llamada `finance-network`.

**Para conectar tu backend a la misma red**, agrega esto en el `docker-compose.yml` de tu backend:

```yaml
services:
  tu-backend:
    # ... tu configuración ...
    networks:
      - finance-network

networks:
  finance-network:
    name: finance-network
    external: true
```

## ⚠️ Importante

- Si cambias `NEXT_PUBLIC_API_BASE_URL`, necesitas **rebuild**:
  ```bash
  docker-compose build --no-cache
  docker-compose up
  ```

- El archivo `.env` NO debe subirse a git (ya está en `.gitignore`)

## 🐛 Troubleshooting

**El frontend no puede conectarse al backend:**
1. Verifica que el backend esté corriendo: `docker ps`
2. Verifica que ambos estén en la misma red: `docker network inspect finance-network`
3. Verifica el nombre del servicio: debe coincidir exactamente

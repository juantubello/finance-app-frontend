# Finanzas App - Frontend

App minimalista de finanzas personales construida con Next.js, TypeScript, TailwindCSS, shadcn/ui y Recharts.

## Stack

- **Framework**: Next.js 16 (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: TailwindCSS + shadcn/ui
- **Gráficos**: Recharts
- **Estado Global**: React Context (MonthYearContext)

## Estructura del Proyecto

```
/app
  /dashboard          # Panel principal
  /monthly
    /expenses         # Gastos mensuales
    /income           # Ingresos mensuales
    /savings          # Ahorros mensuales
  /annual             # Vista anual
  /networth           # Patrimonio neto
  /evolution          # Evolución temporal

/src
  /components         # Componentes de UI
  /contexts           # Contextos de React (MonthYearContext)
  /lib                # Utilidades (api, dummy, format)
  /types              # Tipos TypeScript
```

## Características

- Selector global de Mes/Año en todas las pantallas
- Modo demo con datos dummy para Argentina
- PWA instalable
- Responsive (desktop-first con sidebar, mobile con bottom nav)
- Placeholder para fetch API (comentado, listo para conectar)

## Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Abrir http://localhost:3005/dashboard
```

## Variables de Entorno

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

## Docker

```bash
# Construir imagen
docker build -t finanzas-frontend .

# Ejecutar con docker-compose
docker-compose up -d

# La app estará disponible en http://localhost:3005
```

## Conexión con Backend

El frontend está preparado para conectarse a un backend. Para habilitarlo:

1. Editar `/src/lib/api.ts`
2. Cambiar `USE_DEMO_DATA = false`
3. Descomentar las llamadas fetch en cada función
4. Configurar `NEXT_PUBLIC_API_BASE_URL` con la URL del backend

### Endpoints Esperados

| Endpoint | Descripción | Params |
|----------|-------------|--------|
| `GET /monthly/summary` | Resumen mensual | `year`, `month` |
| `GET /monthly/expenses` | Lista de gastos | `year`, `month` |
| `GET /monthly/income` | Lista de ingresos | `year`, `month` |
| `GET /monthly/savings` | Lista de ahorros | `year`, `month` |
| `GET /annual/summary` | Resumen anual | `year` |
| `GET /networth` | Patrimonio neto | `year`, `month` (opcional) |
| `GET /evolution` | Evolución temporal | `year`, `month`, `range` |

## Tipos TypeScript

Ver `/src/types/finance.ts` para las interfaces completas:
- `Transaction`
- `MonthlySummary`
- `MonthlyListResponse`
- `AnnualSummary`
- `NetWorthSnapshot`
- `EvolutionSeries`

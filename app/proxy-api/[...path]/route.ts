import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3001'

/**
 * Next.js API Route que actúa como proxy para todas las peticiones al backend
 * Esto evita problemas de CORS y permite manejar mejor las cancelaciones
 * 
 * IMPORTANTE: Esta ruta está en /proxy-api/* en lugar de /api/proxy/* para evitar
 * que Cloudflare Access la intercepte, ya que Cloudflare Access protege /api/*
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleProxyRequest(request, params, 'DELETE')
}

async function handleProxyRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  const abortController = new AbortController()
  
  // Si el request del cliente fue cancelado, también cancelar el request al backend
  request.signal.addEventListener('abort', () => {
    abortController.abort()
  })

  try {
    // Construir la URL del backend
    const path = params.path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`

    // Obtener el body si existe (para POST, PUT, etc.)
    let body: string | undefined
    if (method !== 'GET' && method !== 'DELETE') {
      try {
        body = await request.text()
      } catch {
        // No body, está bien
      }
    }

    // Headers a enviar al backend
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }

    // Copiar headers relevantes del request original (como Authorization si existe)
    const authHeader = request.headers.get('authorization')
    if (authHeader) {
      headers['Authorization'] = authHeader
    }

    // Hacer la petición al backend con timeout y soporte para cancelación
    const timeoutId = setTimeout(() => abortController.abort(), 30000) // 30 segundos
    
    try {
      const backendResponse = await fetch(backendUrl, {
        method,
        headers,
        body: body || undefined,
        signal: abortController.signal,
      })

      clearTimeout(timeoutId)

      // Leer la respuesta
      const responseData = await backendResponse.text()
      
      // Crear la respuesta con los mismos headers CORS que necesitamos
      const response = new NextResponse(responseData, {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        headers: {
          'Content-Type': backendResponse.headers.get('Content-Type') || 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      })

      return response
    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      // Si fue cancelado, devolver 499 (Client Closed Request)
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new NextResponse(null, { status: 499 })
      }
      
      throw fetchError
    }
  } catch (error) {
    console.error('[API Proxy] Error:', error)
    
    // Si es un error de timeout o abort, devolver un error apropiado
    if (error instanceof Error) {
      if (error.name === 'AbortError' || error.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'Request timeout' },
          { status: 504 }
        )
      }
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// Manejar OPTIONS para CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

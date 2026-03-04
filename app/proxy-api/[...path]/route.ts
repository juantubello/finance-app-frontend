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
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  return handleProxyRequest(request, context.params, 'GET')
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  return handleProxyRequest(request, context.params, 'POST')
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  return handleProxyRequest(request, context.params, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  return handleProxyRequest(request, context.params, 'DELETE')
}

async function handleProxyRequest(
  request: NextRequest,
  params: Promise<{ path: string[] }> | { path: string[] },
  method: string
) {
  const abortController = new AbortController()
  
  // Si el request del cliente fue cancelado, también cancelar el request al backend
  request.signal.addEventListener('abort', () => {
    abortController.abort()
  })

  try {
    // Resolver params si es una Promise (Next.js 15+)
    let resolvedParams: { path: string[] }
    try {
      // En Next.js 15+, params puede ser una Promise
      if (params && typeof (params as any).then === 'function') {
        resolvedParams = await (params as Promise<{ path: string[] }>)
      } else {
        resolvedParams = params as { path: string[] }
      }
    } catch (paramError) {
      console.error('[API Proxy] Error resolving params:', paramError)
      return NextResponse.json(
        { error: 'Invalid request parameters' },
        { status: 400 }
      )
    }
    
    // Validar que path existe y es un array
    if (!resolvedParams || !resolvedParams.path || !Array.isArray(resolvedParams.path)) {
      // Intentar obtener el path desde la URL directamente como fallback
      const urlPath = request.nextUrl.pathname.replace('/proxy-api/', '')
      
      console.error('[API Proxy] Invalid params structure:', {
        resolvedParams,
        paramsType: typeof params,
        isPromise: params && typeof (params as any).then === 'function',
        pathExists: !!resolvedParams?.path,
        pathIsArray: Array.isArray(resolvedParams?.path),
        rawParams: params,
        urlPathname: request.nextUrl.pathname,
        extractedPath: urlPath,
      })
      
      // Si podemos extraer el path de la URL, usarlo como fallback
      if (urlPath && urlPath !== '/proxy-api' && urlPath !== '/proxy-api/') {
        const pathParts = urlPath.split('/').filter(Boolean)
        if (pathParts.length > 0) {
          resolvedParams = { path: pathParts }
        } else {
          return NextResponse.json(
            { error: 'Invalid request path', details: 'Path parameter is missing or invalid' },
            { status: 400 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'Invalid request path', details: 'Path parameter is missing or invalid' },
          { status: 400 }
        )
      }
    }
    
    // Construir la URL del backend
    const path = resolvedParams.path.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${API_BASE_URL}/${path}${searchParams ? `?${searchParams}` : ''}`
    
    // Log para debugging
    console.log('[API Proxy] Proxying request:', {
      method,
      path: resolvedParams.path,
      backendUrl,
      hasSearchParams: !!searchParams,
    })

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
      
      // Log detallado del error para debugging
      console.error('[API Proxy] Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        backendUrl,
      })
    }

    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
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

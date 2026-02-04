'use client'

export function AppFooter() {
  const version = '0.1.0' // Puedes actualizar esto desde package.json si lo necesitas dinámico
  
  return (
    <footer className="w-full border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto pb-safe md:pb-0">
      <div className="container mx-auto px-4 py-3 md:py-4">
        <div className="flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground md:flex-row md:justify-between">
          <div className="flex flex-col items-center gap-1 text-center md:items-start md:text-left">
            <div>
              © {new Date().getFullYear()} <span className="font-medium text-foreground">Juan Pablo Fernandez Tubello</span>
            </div>
            <div className="text-[10px] md:text-xs">
              Supervisado por <span className="font-medium text-foreground">Camila Victoria Montiel</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 md:items-end md:text-right">
            <div>
              Versión <span className="font-medium text-foreground">{version}</span>
            </div>
            <div className="text-[10px] md:text-xs">
              Todos los derechos reservados
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

#!/usr/bin/env node

/**
 * Script para generar iconos PWA desde una imagen fuente
 * Requiere: sharp (npm install sharp)
 */

const fs = require('fs');
const path = require('path');

// Verificar si sharp está disponible
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp no está instalado.');
  console.log('📦 Instalando sharp...');
  console.log('   Ejecuta: npm install sharp --save-dev');
  console.log('\n💡 Alternativa: Usa una herramienta online como:');
  console.log('   https://realfavicongenerator.net/');
  console.log('   https://www.pwabuilder.com/imageGenerator');
  process.exit(1);
}

const sourceIcon = path.join(__dirname, '../public/icons/icon-fn.png');
const outputDir = path.join(__dirname, '../public/icons');

// Tamaños requeridos
const sizes = [
  { size: 32, name: 'icon-32x32.png' },
  { size: 192, name: 'icon-192.png' },
  { size: 512, name: 'icon-512.png' },
];

// Verificar que existe el icono fuente
if (!fs.existsSync(sourceIcon)) {
  console.error(`❌ No se encontró el icono fuente: ${sourceIcon}`);
  console.log('💡 Asegúrate de tener una imagen en public/icons/icon-fn.png');
  process.exit(1);
}

async function generateIcons() {
  console.log('🎨 Generando iconos PWA...\n');

  try {
    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(sourceIcon)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    // También crear favicon.ico (16x16 y 32x32)
    const faviconPath = path.join(__dirname, '../public/favicon.ico');
    await sharp(sourceIcon)
      .resize(32, 32)
      .png()
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    
    console.log(`✅ Generado: favicon-32x32.png`);
    console.log('\n✨ ¡Iconos generados exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('   1. Verifica que los iconos se vean bien');
    console.log('   2. Si necesitas favicon.ico, conviértelo manualmente o usa una herramienta online');
    
  } catch (error) {
    console.error('❌ Error generando iconos:', error.message);
    process.exit(1);
  }
}

generateIcons();

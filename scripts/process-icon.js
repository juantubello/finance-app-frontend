#!/usr/bin/env node

/**
 * Script para procesar el icono y eliminar el fondo blanco/crema
 * Deja solo el cuadrado negro con FN sobre fondo transparente
 */

const fs = require('fs');
const path = require('path');

let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: sharp no está instalado.');
  console.log('📦 Ejecuta: npm install sharp --save-dev');
  process.exit(1);
}

const sourceIcon = path.join(__dirname, '../public/icons/icon-fn-source.png');
const outputIcon = path.join(__dirname, '../public/icons/icon-fn.png');
const outputDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(sourceIcon)) {
  console.error(`❌ No se encontró el icono fuente: ${sourceIcon}`);
  process.exit(1);
}

async function processIcon() {
  console.log('🎨 Procesando icono para eliminar fondo blanco...\n');

  try {
    const image = sharp(sourceIcon);
    const metadata = await image.metadata();
    
    console.log(`📐 Dimensiones originales: ${metadata.width}x${metadata.height}`);
    
    // Método mejorado: usar extractChannel y operaciones de imagen
    // 1. Obtener los datos raw de la imagen
    const { data, info } = await image
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    
    // 2. Procesar píxel por píxel:
    //    - Eliminar fondo blanco/crema (hacerlo transparente)
    //    - Convertir las letras FN a BLANCAS
    //    - Mantener el fondo negro del cuadrado
    const newData = Buffer.alloc(data.length);
    const threshold = 200; // Umbral de brillo para considerar "fondo claro"
    const darkThreshold = 100; // Umbral para considerar píxeles oscuros (letras o fondo negro)
    
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = info.channels === 4 ? data[i + 3] : 255;
      
      // Calcular brillo del píxel
      const brightness = (r * 0.299 + g * 0.587 + b * 0.114);
      
      // Si el píxel es muy claro (blanco/crema del fondo), hacerlo transparente
      const isLightBackground = brightness > threshold || (r > threshold && g > threshold && b > threshold);
      
      if (isLightBackground && brightness > 180) {
        // Fondo blanco/crema -> transparente
        newData[i] = 0;
        newData[i + 1] = 0;
        newData[i + 2] = 0;
        newData[i + 3] = 0;
      } else if (brightness < darkThreshold) {
        // Píxeles oscuros: pueden ser fondo negro o letras
        // Si es muy oscuro (casi negro), mantenerlo negro (fondo del cuadrado)
        if (brightness < 30) {
          // Fondo negro del cuadrado - mantenerlo negro
          newData[i] = 0;
          newData[i + 1] = 0;
          newData[i + 2] = 0;
          newData[i + 3] = a;
        } else {
          // Letras oscuras -> convertir a BLANCAS
          newData[i] = 255;
          newData[i + 1] = 255;
          newData[i + 2] = 255;
          newData[i + 3] = a;
        }
      } else {
        // Píxeles intermedios (grises) -> convertir a blancos (letras)
        newData[i] = 255;
        newData[i + 1] = 255;
        newData[i + 2] = 255;
        newData[i + 3] = a;
      }
    }
    
    // 3. Crear nueva imagen con fondo transparente
    const processedImage = sharp(newData, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toBuffer();
    
    const finalBuffer = await processedImage;
    
    // Guardar el icono procesado
    await sharp(finalBuffer)
      .png()
      .toFile(outputIcon);
    
    console.log(`✅ Icono procesado guardado en: ${outputIcon}\n`);

    // Regenerar todos los tamaños con fondo transparente
    console.log('🔄 Regenerando iconos en diferentes tamaños...\n');
    
    const sizes = [
      { size: 32, name: 'icon-32x32.png' },
      { size: 192, name: 'icon-192.png' },
      { size: 512, name: 'icon-512.png' },
    ];

    for (const { size, name } of sizes) {
      const outputPath = path.join(outputDir, name);
      
      await sharp(finalBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // Fondo transparente
        })
        .png()
        .toFile(outputPath);
      
      console.log(`✅ Generado: ${name} (${size}x${size})`);
    }

    // Regenerar favicon
    const favicon32 = await sharp(finalBuffer)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    
    await sharp(favicon32)
      .toFile(path.join(outputDir, 'favicon-32x32.png'));
    
    // Copiar como favicon.ico (PNG funciona como ICO en navegadores modernos)
    await sharp(favicon32)
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    
    console.log(`✅ Generado: favicon-32x32.png`);
    console.log(`✅ Generado: favicon.ico`);
    
    console.log('\n✨ ¡Iconos regenerados exitosamente!');
    console.log('💡 Resultado:');
    console.log('   - Fondo blanco/crema eliminado (transparente)');
    console.log('   - Cuadrado negro mantenido');
    console.log('   - Letras FN convertidas a BLANCAS');
    
  } catch (error) {
    console.error('❌ Error procesando icono:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

processIcon();

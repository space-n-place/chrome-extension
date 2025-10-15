#!/usr/bin/env node

/**
 * Скрипт для генерации PNG иконок из SVG для Chrome расширения
 * 
 * Использование:
 * 1. Установите sharp: pnpm install --save-dev sharp
 * 2. Запустите: node scripts/generate-icons.mjs
 * 
 * Альтернатива без sharp:
 * Используйте онлайн конвертеры или ImageMagick/Inkscape (см. public/icons/README.md)
 */

import fs from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const iconsDir = path.join(root, 'public/icons');
const svgPath = path.join(iconsDir, 'icon.svg');

const sizes = [16, 48, 128];

async function generateIcons() {
  // Проверяем наличие SVG файла
  if (!fs.existsSync(svgPath)) {
    console.error('❌ Файл icon.svg не найден в public/icons/');
    console.error('Создайте SVG иконку или используйте существующую');
    process.exit(1);
  }

  // Проверяем наличие sharp
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.error('❌ Библиотека sharp не установлена');
    console.error('');
    console.error('Установите её командой:');
    console.error('  pnpm install --save-dev sharp');
    console.error('');
    console.error('Или используйте альтернативные способы:');
    console.error('  - Онлайн конвертеры (cloudconvert.com, convertio.co)');
    console.error('  - ImageMagick: brew install imagemagick');
    console.error('  - Inkscape: brew install inkscape');
    console.error('');
    console.error('См. public/icons/README.md для подробностей');
    process.exit(1);
  }

  console.log('🎨 Генерация иконок...');
  
  const svgBuffer = fs.readFileSync(svgPath);

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}.png`);
    
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`✓ Создана иконка ${size}x${size}: icon-${size}.png`);
    } catch (error) {
      console.error(`✗ Ошибка при создании иконки ${size}x${size}:`, error.message);
      process.exit(1);
    }
  }

  console.log('');
  console.log('✨ Все иконки успешно созданы!');
  console.log('');
  console.log('Следующий шаг:');
  console.log('  pnpm run build');
}

generateIcons().catch(error => {
  console.error('Ошибка:', error);
  process.exit(1);
});

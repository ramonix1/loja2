const fs = require('fs');
const path = require('path');

const heroiconsPath = path.join(__dirname, '../node_modules/heroicons/24/solid');

// Mapeamento de nomes lógicos para arquivos SVG
const iconMap = {
  shopping_cart: 'shopping-cart.svg',
  package: 'cube.svg',
  check: 'check-circle.svg',
  error: 'x-circle.svg',
  home: 'home.svg',
  settings: 'cog-6-tooth.svg',
  money: 'currency-dollar.svg',
  user: 'user.svg',
  robot: 'bolt.svg',
  lock: 'lock-closed.svg',
  phone: 'device-phone-mobile.svg',
  star: 'star.svg',
  person: 'user-circle.svg',
  tag: 'tag.svg',
  image: 'photo.svg',
  building: 'building-office-2.svg',
  users: 'users.svg',
  shopping_bag: 'shopping-bag.svg',
  lock_secure: 'lock-closed.svg',
  calendar: 'calendar.svg',
  paint: 'paint-brush.svg',
  chart: 'chart-bar.svg',
  chat: 'chat-bubble-left.svg',
};

// Cache dos SVGs
const svgCache = {};

/**
 * Retorna um ícone SVG como string HTML
 * @param {string} iconName - Nome lógico do ícone (ex: 'shopping_cart')
 * @param {Object} options - Opções (classes, width, height, etc)
 * @returns {string} SVG HTML inline
 */
function getIcon(iconName, options = {}) {
  const filename = iconMap[iconName];

  if (!filename) {
    console.warn(`Icon ${iconName} not found in iconMap`);
    return '';
  }

  // Usar cache se disponível
  if (!svgCache[filename]) {
    try {
      const filePath = path.join(heroiconsPath, filename);
      svgCache[filename] = fs.readFileSync(filePath, 'utf8');
    } catch (err) {
      console.error(`Error reading icon ${filename}:`, err.message);
      return '';
    }
  }

  let svg = svgCache[filename];

  // Adicionar classes CSS se fornecidas
  if (options.class) {
    svg = svg.replace('<svg ', `<svg class="${options.class}" `);
  }

  // Adicionar atributos customizados
  if (options.width) {
    svg = svg.replace('<svg ', `<svg width="${options.width}" `);
  }
  if (options.height) {
    svg = svg.replace('<svg ', `<svg height="${options.height}" `);
  }

  return svg;
}

/**
 * Versão simplificada para usar em templates EJS
 * Retorna apenas SVG inline com classe padrão
 */
function icon(iconName, cssClass = 'w-5 h-5') {
  return getIcon(iconName, { class: cssClass });
}

module.exports = {
  getIcon,
  icon,
  iconMap,
};

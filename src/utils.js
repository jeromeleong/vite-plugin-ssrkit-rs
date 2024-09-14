import path from 'path';
import fs from 'fs/promises';

import logger from './logger.js';


export function getFileExtension(framework) {
  switch (framework) {
    case 'react': return '.jsx';
    case 'vue2':
    case 'vue3': return '.vue';
    case 'svelte': return '.svelte';
    default: return '.js';
  }
}

export async function getFilesRecursively(dir, fileExtension) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const res = path.join(dir, entry.name);
    return entry.isDirectory() ? getFilesRecursively(res, fileExtension) : res;
  }));
  return files.flat().filter(file => file.endsWith(fileExtension));
}

export async function generateRoutes(routesDir, framework) {
  logger.info('開始生成路由');
  try {
    const fileExtension = getFileExtension(framework);
    const files = await getFilesRecursively(routesDir, fileExtension);
    const routes = [];

    const imports = files.map((file, index) => {
      const relativePath = normalizePathForImport(path.relative(routesDir, file));
      return `import Component${index} from '/routes/${relativePath}';`;
    }).join('\n');

    const routesCode = files.map((file, index) => {
      const relativePath = normalizePathForImport(path.relative(routesDir, file));
      let routePath = relativePath.replace(new RegExp(`\\${fileExtension}$`), "");
      const isExact = !routePath.includes('[');
      
      if (routePath === 'index') {
        routePath = '';
      } else {
        routePath = routePath
          .replace(/\[([^\]]+)\]/g, ':$1')
          .replace(/\/$/, '');
      }
      
      routes.push({ path: routePath, file: relativePath });
      
      return `  { path: '${routePath}', component: Component${index}${isExact ? ', exact: true' : ''} }`;
    }).join(',\n');

    const code = `
${imports}

export const routes = [
${routesCode}
];

export function getRouteComponent(url, params) {
  const cleanUrl = url.replace(/^\\//, '');
  
  let route = routes.find(r => r.exact && r.path === cleanUrl);
  
  if (!route) {
    route = routes.find(r => {
      if (r.exact) return false;
      const routeParts = r.path.split('/');
      const urlParts = cleanUrl.split('/');
      if (routeParts.length !== urlParts.length) return false;
      return routeParts.every((part, i) => part.startsWith(':') || part === urlParts[i]);
    });
  }

  if (!route && (cleanUrl === '' || cleanUrl === 'index')) {
    route = routes.find(r => r.path === '' || r.path === 'index');
  }

  if (!route) {
    throw new Error(\`找不到對應的路由: \${url}\`);
  }

  const componentProps = { ...params, ...(route.props || {}) };

  return {
    component: route.component,
    componentProps
  };
}
`;

    logger.info('路由生成完成');
    return { code, routes };
  } catch (error) {
    logger.error('生成路由時發生錯誤:');
    logger.error(error.stack || error.message);
    throw error;
  }
}

export function normalizePathForImport(filePath) {
  return filePath.replace(/\\/g, '/');
}
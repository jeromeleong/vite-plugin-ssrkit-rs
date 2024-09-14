import { defineConfig } from 'vite';
import { promises as fs } from 'fs';

import logger from '../logger.js';
import {
  getFrameworkPlugins,
  generateFrameworkClientEntry
} from '../framework/index.js';
import { generateRoutes } from '../utils.js';

const VIRTUAL_CLIENT_ENTRY_ID = 'virtual:ssrkit-client-entry';
const VIRTUAL_CLIENT_ROUTES_ID = 'virtual:client-routes';

export function createClient(options = {}) {
  const {
    outDir = './dist/client',
    routesDir = './src/routes',
    appComponent = './src/App.svelte',
    framework = 'svelte'
  } = options;

  let resolvedClientRoutes = '';
  let resolvedClientEntry = '';
  let parsedClientRoutes = [];

  return {
    name: 'ssrkit-client',
    async buildStart() {
      try {
        const routeInfo = await generateRoutes(routesDir, framework);
        resolvedClientRoutes = routeInfo.code;
        parsedClientRoutes = routeInfo.routes;
        resolvedClientEntry = generateFrameworkClientEntry(appComponent, framework, VIRTUAL_CLIENT_ROUTES_ID);
    
        logger.info('解析的客戶端路由:');
        parsedClientRoutes.forEach(route => {
          logger.debug(`     ./${route.path} => ${route.file}`);
        });
        logger.info('客戶端處理完成');
      } catch (error) {
        logger.error('處理客戶端代碼時發生錯誤:');
        logger.error(error.stack || error.message);
        throw error;
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_CLIENT_ENTRY_ID || id === VIRTUAL_CLIENT_ROUTES_ID) {
        return id;
      }
    },
    load(id) {
      if (id === VIRTUAL_CLIENT_ENTRY_ID) {
        return resolvedClientEntry;
      }
      if (id === VIRTUAL_CLIENT_ROUTES_ID) {
        return resolvedClientRoutes;
      }
    },
    config(config) {
      return defineConfig({
        ...config,
        plugins: [
          ...(config.plugins || []),
          ...getFrameworkPlugins(framework)
        ],
        build: {
          outDir: outDir,
          emptyOutDir: true,
          rollupOptions: {
            input: VIRTUAL_CLIENT_ENTRY_ID,
            output: {
              format: 'es',
              entryFileNames: 'client.js',
            },
          },
          minify: false,
          reportCompressedSize: false,
          chunkSizeWarningLimit: Infinity,
        },
        resolve: {
          ...config.resolve,
          alias: {
            ...config.resolve?.alias,
            '/routes': routesDir
          }
        },
        logLevel: 'silent',
      });
    },
    async closeBundle() {
      logger.info('開始構建客戶端文件');
      try {
        const outDirExists = await fs.access(outDir).then(() => true).catch(() => false);
        if (!outDirExists) {
          logger.warn(`輸出目錄 ${outDir} 不存在，跳過最終處理`);
          return;
        }
        logger.info(`已構建客戶端文件：${outDir}/client.js`);
        logger.info('客戶端構建完成');
      } catch (error) {
        logger.error('客戶端構建時發生錯誤:');
        logger.error(error.stack || error.message);
      }
    }
  };
}
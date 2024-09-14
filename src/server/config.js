import { defineConfig } from 'vite';
import { promises as fs } from 'fs';

import logger from '../logger.js';
import {
  getFrameworkPlugins,
  getFrameworkSsrPlugins,
  generateFrameworkServerEntry
} from '../framework/index.js';
import { generateRoutes } from '../utils.js';

const VIRTUAL_ENTRY_ID = 'virtual:ssrkit-entry';
const VIRTUAL_ROUTES_ID = 'virtual:routes';

export function createServer(options = {}) {
  const {
    outDir = './dist/server',
    routesDir = './src/routes',
    appComponent = './src/App.svelte',
    framework = 'svelte'
  } = options;

  let resolvedRoutes = '';
  let resolvedEntry = '';
  let parsedRoutes = [];

  return {
    name: 'ssrkit-server',
    async buildStart() {
      try {
        const routeInfo = await generateRoutes(routesDir, framework);
        resolvedRoutes = routeInfo.code;
        parsedRoutes = routeInfo.routes;
        resolvedEntry = generateFrameworkServerEntry(appComponent, framework, VIRTUAL_ROUTES_ID);
    
        logger.info('解析的服務器端路由:');
        parsedRoutes.forEach(route => {
          logger.debug(`     ./${route.path} => ${route.file}`);
        });
        logger.info('服務器端處理完成');
      } catch (error) {
        logger.error('處理服務器端代碼時發生錯誤:');
        logger.error(error.stack || error.message);
        throw error;
      }
    },
    resolveId(id) {
      if (id === VIRTUAL_ENTRY_ID || id === VIRTUAL_ROUTES_ID) {
        return id;
      }
    },
    load(id) {
      if (id === VIRTUAL_ENTRY_ID) {
        return resolvedEntry;
      }
      if (id === VIRTUAL_ROUTES_ID) {
        return resolvedRoutes;
      }
    },
    config(config) {
      return defineConfig({
        ...config,
        plugins: [
          ...(config.plugins || []),
          ...getFrameworkPlugins(framework),
          ...getFrameworkSsrPlugins(framework)
        ],
        build: {
          outDir: outDir,
          emptyOutDir: true,
          ssr: true,
          rollupOptions: {
            input: VIRTUAL_ENTRY_ID,
            output: {
              format: 'es',
              entryFileNames: 'server.js',
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
      logger.info('開始構建服務器文件');
      try {
        const outDirExists = await fs.access(outDir).then(() => true).catch(() => false);
        if (!outDirExists) {
          logger.warn(`輸出目錄 ${outDir} 不存在，跳過最終處理`);
          return;
        }
        logger.info(`已構建服務器文件：${outDir}/server.js`);
        logger.info('服務器端構建完成');
      } catch (error) {
        logger.error('服務器端構建時發生錯誤:');
        logger.error(error.stack || error.message);
      }
    }
  };
}
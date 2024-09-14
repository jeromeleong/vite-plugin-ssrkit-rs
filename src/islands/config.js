import fs from 'fs/promises';
import path from 'path';
import { build } from 'esbuild';

import { generateEntryContent } from './generator.js';
import { getFrameworkPlugins, getFrameworkLoader } from '../framework/index.js';
import { getFileExtension, getFilesRecursively } from '../utils.js';
import logger from '../logger.js';

export function createIslands(options = {}) {
  const {
    framework = 'default',
    islandsDir = './frontend/components/islands',
    outDir = './dist/client/islands',
    chunkCommonCode = false  // 新增的選項
  } = options;

  let islandFiles = [];
  let isInitialized = false;

  async function initialize() {
    if (isInitialized) return;
    const fileExtension = getFileExtension(framework);
    islandFiles = await getFilesRecursively(islandsDir, fileExtension);
    isInitialized = true;
  }

  return {
    name: 'ssrkit-islands',
    
    async buildStart() {
      await initialize();
      if (islandFiles.length === 0) {
        logger.warn('沒有找到任何 island 檔案。');
      } else {
        logger.info(`找到 ${islandFiles.length} 個 island 檔案`);
        await generateEntryFiles(islandFiles, islandsDir, framework);
      }
      logger.info('Islands 處理完成');
    },
    
    async closeBundle() {
      logger.info('開始構建 Islands');
      if (islandFiles.length === 0) {
        logger.info('沒有 Island 檔案，跳過 Islands 構建');
        return;
      }

      const buildOptions = {
        bundle: true,
        minify: true,
        format: 'esm',
        target: ['es2015'],
        plugins: getFrameworkPlugins(framework),
        loader: getFrameworkLoader(framework),
      };

      if (chunkCommonCode) {
        buildOptions.splitting = true;
        buildOptions.outdir = outDir;
        buildOptions.chunkNames = 'chunks/[name]-[hash]';
        buildOptions.metafile = true;
      }

      try {
        if (chunkCommonCode) {
          // 使用單一構建來生成所有 islands 和共享 chunks
          const entryPoints = {};
          for (const file of islandFiles) {
            const name = path.basename(file, path.extname(file)).toLowerCase();
            const entryPath = path.resolve(islandsDir, `${name}-entry.js`);
            entryPoints[name] = entryPath;
          }

          const result = await build({
            ...buildOptions,
            entryPoints,
          });

          if (result.metafile) {
            logger.info('生成的 chunks:');
            for (const [file, info] of Object.entries(result.metafile.outputs)) {
              if (file.includes('chunks/')) {
                logger.info(`  ${file} (${(info.bytes / 1024).toFixed(2)} KB)`);
              }
            }
          }
        } else {
          // 原有的單獨構建每個 island 的邏輯
          for (const file of islandFiles) {
            const name = path.basename(file, path.extname(file)).toLowerCase();
            const entryPath = path.resolve(islandsDir, `${name}-entry.js`);
            const outfile = path.resolve(outDir, `${name}.js`);

            await build({
              ...buildOptions,
              entryPoints: [entryPath],
              outfile,
            });
            logger.info(`已構建 Island: ${outfile}`);
          }
        }
      } catch (error) {
        logger.error(`構建 Islands 失敗:`, error);
      }

      await cleanupEntryFiles(islandsDir);
      logger.info('Islands 構建完成');
    },
  };
}

async function generateEntryFiles(islandFiles, islandsDir, framework) {
  for (const file of islandFiles) {
    const name = path.basename(file, getFileExtension(framework));
    const entryPath = path.join(islandsDir, `${name.toLowerCase()}-entry.js`);
    const componentFile = `./${path.basename(file)}`;
    const entryContent = generateEntryContent(componentFile, name, framework);
    await fs.writeFile(entryPath, entryContent);
    logger.info(`生成入口檔案: ${entryPath}`);
  }
}

async function cleanupEntryFiles(islandsDir) {
  try {
    const files = await fs.readdir(islandsDir);
    const entryFiles = files.filter(file => file.endsWith('-entry.js'));
    for (const file of entryFiles) {
      await fs.unlink(path.join(islandsDir, file));
      logger.info(`清理入口檔案: ${file}`);
    }
  } catch (error) {
    logger.error('清理入口檔案時發生錯誤:', error);
  }
}
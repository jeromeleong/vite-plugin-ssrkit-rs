import { createIslands } from './islands/config.js';
import { createServer } from './server/config.js';
import { createClient } from './client/config.js';
import logger from './logger.js';

function createAll(options = {}) {
  const { islands, server, client } = options;

  const plugins = [];

  if (islands) {
    logger.info('初始化 Islands 插件');
    plugins.push(createIslands(islands));
  }

  if (server) {
    logger.info('初始化 Server 插件');
    plugins.push(createServer(server));
  }

  if (client) {
    logger.info('初始化 Client 插件');
    plugins.push(createClient(client));
  }

  if (plugins.length === 0) {
    logger.warn('未提供 Islands、Server 或 Client 配置，不會編譯任何內容');
    return {
      name: 'ssrkit-empty',
      // 返回一個空插件
    };
  }

  return {
    name: 'ssrkit',
    async buildStart() {
      if (islands) {
        console.log('\n--islands 處理開始--\n');
        for (const plugin of plugins) {
          if (plugin.name === 'ssrkit-islands' && plugin.buildStart) {
            await plugin.buildStart.call(this);
          }
        }
        console.log('\n--islands 處理結束--\n');
      }

      if (server) {
        console.log('\n--server 處理開始--\n');
        for (const plugin of plugins) {
          if (plugin.name === 'ssrkit-server' && plugin.buildStart) {
            await plugin.buildStart.call(this);
          }
        }
        console.log('\n--server 處理結束--\n');
      }

      if (client) {
        console.log('\n--client 處理開始--\n');
        for (const plugin of plugins) {
          if (plugin.name === 'ssrkit-client' && plugin.buildStart) {
            await plugin.buildStart.call(this);
          }
        }
        console.log('\n--client 處理結束--\n');
      }
    },
    resolveId(id) {
      for (const plugin of plugins) {
        if (plugin.resolveId) {
          const resolved = plugin.resolveId(id);
          if (resolved) return resolved;
        }
      }
    },
    load(id) {
      for (const plugin of plugins) {
        if (plugin.load) {
          const loaded = plugin.load(id);
          if (loaded) return loaded;
        }
      }
    },
    async closeBundle() {
      console.log('\n--JS文件構建開始--\n');
      for (const plugin of plugins) {
        if (plugin.closeBundle) {
          await plugin.closeBundle.call(this);
        }
      }
      console.log('\n---JS文件構建結束--\n');
    },
    config(config) {
      let resultConfig = config;
      for (const plugin of plugins) {
        if (plugin.config) {
          resultConfig = plugin.config(resultConfig);
        }
      }
      return resultConfig;
    }
  };
}

export { createAll as default };
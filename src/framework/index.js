import { getSveltePlugins, getSvelteLoader, getSvelteSsrPlugins } from './svelte/config.js';
import { generateSvelteServerEntry, generateSvelteClientEntry } from './svelte/entry.js';

export function getFrameworkPlugins(framework) {
  switch (framework) {
    case 'svelte':
      return getSveltePlugins();
    // 其他框架的插件配置
    default:
      return [];
  }
}

export function getFrameworkLoader(framework) {
  switch (framework) {
    case 'svelte':
      return getSvelteLoader();
    // 其他框架的 loader 配置
    default:
      return {};
  }
}

export function getFrameworkSsrPlugins(framework) {
  switch (framework) {
    case 'svelte':
      return getSvelteSsrPlugins();
    // 其他框架的 SSR 插件配置
    default:
      return [];
  }
}

export function generateFrameworkServerEntry(appComponent, framework, VIRTUAL_ROUTES_ID) {
  switch (framework) {
    case 'svelte':
      return generateSvelteServerEntry(appComponent, VIRTUAL_ROUTES_ID);
    case 'react':
      return generateReactServerEntry(appComponent, VIRTUAL_ROUTES_ID);
    case 'vue2':
    case 'vue3':
      return generateVueServerEntry(appComponent, framework, VIRTUAL_ROUTES_ID);
    default:
      return generateDefaultServerEntry(appComponent, VIRTUAL_ROUTES_ID);
  }
}

export function generateFrameworkClientEntry(appComponent, framework, VIRTUAL_ROUTES_ID) {
  switch (framework) {
    case 'svelte':
      return generateSvelteClientEntry(appComponent, VIRTUAL_ROUTES_ID);
    case 'react':
      return generateReactClientEntry(appComponent, VIRTUAL_ROUTES_ID);
    case 'vue2':
    case 'vue3':
      return generateVueClientEntry(appComponent, framework, VIRTUAL_ROUTES_ID);
    default:
      return generateDefaultClientEntry(appComponent, VIRTUAL_ROUTES_ID);
  }
}

function generateReactServerEntry(appComponent, VIRTUAL_ROUTES_ID) {
  // 實現 React 的服務器入口邏輯
  throw new Error('React 服務器入口生成邏輯尚未實現');
}

function generateVueServerEntry(appComponent, version, VIRTUAL_ROUTES_ID) {
  // 實現 Vue 的服務器入口邏輯
  throw new Error('Vue 服務器入口生成邏輯尚未實現');
}

function generateDefaultServerEntry(appComponent, VIRTUAL_ROUTES_ID) {
  return `
    import App from '${appComponent}';
    import { getRouteComponent } from '${VIRTUAL_ROUTES_ID}';

    export function render(props) {
      const { url, params, islands } = JSON.parse(props);
      
      const { component, componentProps } = getRouteComponent(url, params);

      const rendered = App.render({
        url,
        component,
        props: componentProps,
        islands
      });

      return JSON.stringify({
        html: rendered.html,
        css: rendered.css,
        head: rendered.head
      });
    }
  `;
}

function generateReactClientEntry(appComponent, VIRTUAL_ROUTES_ID) {
  // 實現 React 的客戶端入口邏輯
  throw new Error('React 客戶端入口生成邏輯尚未實現');
}

function generateVueClientEntry(appComponent, version, VIRTUAL_ROUTES_ID) {
  // 實現 Vue 的客戶端入口邏輯
  throw new Error('Vue 客戶端入口生成邏輯尚未實現');
}

function generateDefaultClientEntry(appComponent, VIRTUAL_ROUTES_ID) {
  return `
    import App from '${appComponent}';
    import { getRouteComponent } from '${VIRTUAL_ROUTES_ID}';

    function hydrate() {
      const { url, params } = JSON.parse(document.getElementById('__SSRKIT_DATA__').textContent);
      
      const { component, componentProps } = getRouteComponent(url, params);

      new App({
        target: document.body,
        hydrate: true,
        props: {
          url,
          component,
          props: componentProps
        }
      });
    }

    hydrate();
  `;
}
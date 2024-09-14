import sveltePlugin from 'esbuild-svelte';

export function getSveltePlugins() {
  return [sveltePlugin({
    compilerOptions: {
      css: 'injected',
      hydratable: true,
    },
    emitCss: false,
  })];
}

export function getSvelteLoader() {
  return { '.svelte': 'js' };
}

// 新增的 SSR 配置函數
export function getSvelteSsrPlugins() {
  return [sveltePlugin({
    compilerOptions: {
      generate: 'ssr'  // 為 SSR 添加這個選項
    },
  })];
}
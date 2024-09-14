export function generateEntryContent(componentFile, name, framework) {
  const { importStatement, newComponentStatement } = getFrameworkSpecificCode(framework, componentFile);

  return `
${importStatement}

function hydrateIsland(el) {
  const props = JSON.parse(el.dataset.props || '{}');
  el.querySelector('[placeholder]')?.remove();
  ${newComponentStatement};
}

${getHandleIslandLoadingFunction(name)}

if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', handleIslandLoading);
  } else {
    handleIslandLoading();
  }
}

export default Component;
`;
}

function getFrameworkSpecificCode(framework, componentFile) {
  switch (framework) {
    case 'react':
      return {
        importStatement: `import React from 'react';\nimport Component from '${componentFile}';`,
        newComponentStatement: `React.createElement(Component, props)`
      };
    case 'vue2':
      return {
        importStatement: `import Vue from 'vue';\nimport Component from '${componentFile}';`,
        newComponentStatement: `new Vue({ render: h => h(Component, { props }) }).$mount(el)`
      };
    case 'vue3':
      return {
        importStatement: `import { createApp } from 'vue';\nimport Component from '${componentFile}';`,
        newComponentStatement: `createApp(Component, props).mount(el)`
      };
    case 'svelte':
      return {
        importStatement: `import Component from '${componentFile}';`,
        newComponentStatement: `new Component({ target: el, props: props, hydrate: true })`
      };
    default:
      return {
        importStatement: `import Component from '${componentFile}';`,
        newComponentStatement: `typeof Component === 'function' ? Component(el, props) : console.error('無效的組件')`
      };
  }
}

function getHandleIslandLoadingFunction(name) {
  return `
function handleIslandLoading() {
  const islands = document.querySelectorAll('[data-island="${name}"]');
  islands.forEach(el => {
    const props = JSON.parse(el.dataset.props || '{}');
    const loadStrategy = props.client || 'load';
    
    const hydrateThisIsland = () => {
      if (!el.hasAttribute('data-island')) {
        return;
      }
      hydrateIsland(el);
    };

    switch (loadStrategy) {
      case 'idle':
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(hydrateThisIsland);
        } else {
          setTimeout(hydrateThisIsland, 0);
        }
        break;
      case 'visible':
        if ('IntersectionObserver' in window) {
          const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                hydrateThisIsland();
                observer.unobserve(el);
              }
            });
          });
          observer.observe(el);
        } else {
          hydrateThisIsland();
        }
        break;
      case 'load':
      default:
        hydrateThisIsland();
        break;
    }
  });
}
`;
}
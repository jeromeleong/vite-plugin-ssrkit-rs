export function generateSvelteServerEntry(appComponent, VIRTUAL_ROUTES_ID) {
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
      css: rendered.css.code,
      head: rendered.head
    });
  }
  `;
}

export function generateSvelteClientEntry(appComponent, VIRTUAL_ROUTES_ID) {
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
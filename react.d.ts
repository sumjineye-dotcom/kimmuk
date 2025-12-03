declare module 'react' {
  export = React;
  export as namespace React;
  
  namespace React {
    type FC<P = {}> = (props: P) => JSX.Element | null;
    type ReactNode = JSX.Element | string | number | boolean | null | undefined;
  }
}

declare module 'react-dom' {
  export function createRoot(container: Element | DocumentFragment): any;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element {
      type: any;
      props: any;
      key: any;
    }
    
    interface IntrinsicElements {
      div: any;
      span: any;
      button: any;
      input: any;
      textarea: any;
      form: any;
      label: any;
      p: any;
      h1: any;
      h2: any;
      h3: any;
      h4: any;
      h5: any;
      h6: any;
      a: any;
      img: any;
      [elemName: string]: any;
    }
  }
  
  export function jsx(type: any, props: any, key?: any): JSX.Element;
  export function jsxs(type: any, props: any, key?: any): JSX.Element;
  export function Fragment(props: { children?: any }): JSX.Element;
}

declare module 'react/jsx-dev-runtime' {
  export * from 'react/jsx-runtime';
}

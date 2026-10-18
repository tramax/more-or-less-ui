// Plain stylesheets are side-effect imports (e.g. `import '@/styles.css'`) and have no exports
declare module '*.css' {}

declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

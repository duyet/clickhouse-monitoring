declare module '*.css' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.module.css' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.scss' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.module.scss' {
  const classes: { [key: string]: string }
  export default classes
}

declare module '*.sass' {
  const content: { [className: string]: string }
  export default content
}

declare module '*.module.sass' {
  const classes: { [key: string]: string }
  export default classes
}

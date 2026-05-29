// https://stackoverflow.com/a/54178819
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// https://stackoverflow.com/a/51399781
export type ArrayElement<ArrayType extends readonly unknown[]> =
  ArrayType extends readonly (infer ElementType)[] ? ElementType : never

// https://stackoverflow.com/a/49286056
export type ValueOf<T> = T[keyof T]

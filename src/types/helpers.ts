/**
 * @description Infer the return type of a simple function types
 */
export type GetReturnType<F> = F extends (...args: any[]) => infer Return ? Return : never;
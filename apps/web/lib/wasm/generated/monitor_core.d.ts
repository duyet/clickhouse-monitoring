/* tslint:disable */
/* eslint-disable */
/**
 * WASM export to transform a ClickHouse JSON-each-row string into a normalized JSON array.
 */
export function transform_clickhouse_json_each_row_json(input: string): string;
/**
 * WASM export accepting JsValue input and returning JsValue output — zero JSON string overhead.
 * JS side: pass pre-parsed array directly, get result object directly.
 */
export function transform_user_event_counts_v3(input: any, time_field: string): any;
/**
 * WASM export returning JsValue directly — avoids JSON string intermediate.
 */
export function transform_user_event_counts_v2(input: string, time_field: string): any;
/**
 * Legacy export returning JSON string (kept for backward compat).
 */
export function transform_user_event_counts_json(input: string, time_field: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly transform_clickhouse_json_each_row_json: (a: number, b: number, c: number) => void;
  readonly transform_user_event_counts_json: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly transform_user_event_counts_v2: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly transform_user_event_counts_v3: (a: number, b: number, c: number, d: number) => void;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export3: (a: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export4: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;

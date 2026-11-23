export type SandboxFiles = Readonly<Record<string, string>>;

export interface StartOptions {
  readonly files: SandboxFiles;
  readonly entry: string;
  readonly env?: Readonly<Record<string, string>>;
  readonly startTimeoutMs?: number;
  readonly maxLifetimeMs?: number;
}
export interface SandboxHandle {
  readonly baseUrl: string;
  logs(): string;
  stop(): Promise<void>;
}
export interface SandboxAdapter {
  readonly kind: string;
  /** true only for adapters providing real isolation (e.g. E2B microVM). */
  readonly isolated: boolean;
  start(o: StartOptions): Promise<SandboxHandle>;
}
export type SandboxErrorCode = "unsafe_path" | "start_timeout" | "exited_early";
export class SandboxError extends Error {
  constructor(readonly code: SandboxErrorCode, message: string) {
    super(message);
    this.name = "SandboxError";
  }
}

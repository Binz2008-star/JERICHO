import type { Files } from "./spec";

export interface Version { readonly id: number; readonly message: string; readonly files: Files; }

/** In-memory snapshot store. Code snapshots only: app DATA lives outside and is never reverted by undo. */
export class VersionStore {
  private readonly list: Version[] = [];
  commit(files: Files, message: string): Version {
    const v: Version = { id: this.list.length + 1, message, files };
    this.list.push(v);
    return v;
  }
  current(): Version {
    const v = this.list[this.list.length - 1];
    if (!v) throw new Error("no versions");
    return v;
  }
  /** Drops the latest version and returns the one restored. */
  undo(): Version {
    if (this.list.length < 2) throw new Error("nothing to undo");
    this.list.pop();
    return this.current();
  }
  get size(): number { return this.list.length; }
}

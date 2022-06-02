export interface Monitor {
  status: string;
  crashes: number;
  command: string[];
  cwd: string;
  env: Record<string, string>;
  data: Record<string, string>;
}

export type Monitors = Record<string, Monitor>;

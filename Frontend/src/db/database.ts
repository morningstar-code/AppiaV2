import Dexie, { Table } from 'dexie';

export interface Session {
  id?: number;
  projectId: string;
  lastUpdated: Date;
  messages: any[];
  files: any[];
  openTabs: string[];
  selectedFile: string | null;
  tokens: {
    used: number;
    remaining: number;
  };
}

export interface FileCache {
  id?: number;
  path: string;
  content: string;
  lastModified: Date;
  projectId: string;
}

export class AppDatabase extends Dexie {
  sessions!: Table<Session>;
  fileCache!: Table<FileCache>;

  constructor() {
    super('AppiaBuilderDB');
    this.version(1).stores({
      sessions: '++id, projectId, lastUpdated',
      fileCache: '++id, &path, projectId, lastModified'
    });
  }
}

export const db = new AppDatabase();

import { save, open } from '@tauri-apps/plugin-dialog';
import { copyFile, BaseDirectory } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { getDb } from './db';
import { DEMO_MODE } from './demo';

const DB_FILENAME = 'inscriptions.db';

const todayStamp = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const exportDatabase = async (): Promise<boolean> => {
  if (DEMO_MODE) throw new Error('Indisponible en mode démonstration.');
  const target = await save({
    title: 'Exporter la base de données',
    defaultPath: `inscriptions_${todayStamp()}.db`,
    filters: [{ name: 'SQLite', extensions: ['db'] }],
  });
  if (!target) return false;

  const sourcePath = await join(await appDataDir(), DB_FILENAME);
  await copyFile(sourcePath, target);
  return true;
};

export const importDatabase = async (): Promise<boolean> => {
  if (DEMO_MODE) throw new Error('Indisponible en mode démonstration.');
  const picked = await open({
    title: 'Importer une base de données',
    multiple: false,
    directory: false,
    filters: [{ name: 'SQLite', extensions: ['db', 'sqlite', 'sqlite3'] }],
  });
  if (!picked || typeof picked !== 'string') return false;

  const db = await getDb();
  await db.close();

  await copyFile(picked, DB_FILENAME, { toPathBaseDir: BaseDirectory.AppData });
  return true;
};

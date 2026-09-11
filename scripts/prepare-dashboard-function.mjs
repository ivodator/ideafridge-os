import { readFile, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const handler = await readFile(new URL('supabase/functions/connect/handler.js', root), 'utf8');
const entry = await readFile(new URL('supabase/functions/connect/index.ts', root), 'utf8');
const withoutImport = entry.replace(/^import \{ createContactHandler \} from '\.\/handler\.js';\s*/m, '');
await writeFile(new URL('supabase/dashboard-connect.ts', root), '// Generated from functions/connect/handler.js and index.ts.\n// Paste this complete file into the Supabase dashboard editor.\n// Regenerate with: node scripts/prepare-dashboard-function.mjs\n\n' + handler + '\n' + withoutImport);
console.log('Prepared supabase/dashboard-connect.ts');

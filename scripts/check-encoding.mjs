import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { extname } from 'node:path';

const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.md',
  '.mjs',
  '.py',
  '.sql',
  '.ts',
  '.tsx',
  '.yaml',
  '.yml',
]);
const explicitTextFiles = new Set(['.editorconfig', '.gitattributes']);
const decoder = new TextDecoder('utf-8', { fatal: true });
const mojibakePattern = /(?:\u00c3.|\u00c2.)/u;
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  {
    encoding: 'buffer',
  },
)
  .toString('utf8')
  .split('\0')
  .filter(Boolean)
  .filter((file) => existsSync(file))
  .filter((file) => textExtensions.has(extname(file)) || explicitTextFiles.has(file));
const failures = [];

for (const file of files) {
  try {
    const content = decoder.decode(readFileSync(file));
    if (content.includes('\uFFFD'))
      failures.push(`${file}: contiene el car\u00e1cter de reemplazo Unicode.`);
    if (mojibakePattern.test(content))
      failures.push(`${file}: contiene una secuencia t\u00edpica de mojibake.`);
  } catch {
    failures.push(`${file}: no est\u00e1 codificado como UTF-8 v\u00e1lido.`);
  }
}

if (failures.length > 0) {
  console.error('La verificaci\u00f3n de codificaci\u00f3n encontr\u00f3 problemas:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`UTF-8 v\u00e1lido y sin mojibake en ${files.length} archivos de texto versionados.`);
}

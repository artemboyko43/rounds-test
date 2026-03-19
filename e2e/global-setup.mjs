import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const serverDir = path.join(root, 'server');
const prismaDir = path.join(serverDir, 'prisma');

function wipeE2EDatabaseArtifacts() {
  if (!fs.existsSync(prismaDir)) return;
  for (const file of fs.readdirSync(prismaDir)) {
    if (file === 'e2e.db' || file.startsWith('e2e.db-')) {
      fs.unlinkSync(path.join(prismaDir, file));
    }
  }
}

export default async function globalSetup() {
  wipeE2EDatabaseArtifacts();

  execSync('npx prisma migrate deploy', {
    cwd: serverDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: 'file:./prisma/e2e.db',
    },
  });
}

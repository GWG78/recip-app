import { spawnSync } from 'node:child_process';

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: process.env,
  });

  if (result.error) {
    console.error(`[dev-launcher] Failed to run ${command}:`, result.error);
    process.exit(1);
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    process.exit(result.status);
  }
}

if (process.env.DATABASE_URL) {
  console.log('[dev-launcher] DATABASE_URL detected, running prisma migrate deploy');
  run('npx', ['prisma', 'migrate', 'deploy']);
} else {
  console.log('[dev-launcher] Skipping prisma migrate deploy: DATABASE_URL is not set');
}

run('npm', ['exec', 'react-router', 'dev']);

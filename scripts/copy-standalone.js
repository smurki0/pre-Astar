// Cross-platform post-build copy for Next.js `output: "standalone"`.
// Replaces the Windows-only `robocopy` commands so the build works on
// Linux/macOS CI and servers as well.
// This is a plain CommonJS Node build script (run via `node scripts/...`),
// so `require()` is the correct module syntax here.
/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const root = process.cwd();

/** Recursively copy a directory (Node 16.7+ has fs.cpSync). */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`[copy-standalone] skip (not found): ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
  console.log(`[copy-standalone] copied ${src} -> ${dest}`);
}

copyDir(
  path.join(root, '.next', 'static'),
  path.join(root, '.next', 'standalone', '.next', 'static')
);
copyDir(
  path.join(root, 'public'),
  path.join(root, '.next', 'standalone', 'public')
);

// The Prisma schema + migrations are required at runtime so that
// `prisma migrate deploy` can be run against the production database from the
// standalone output, and so the query engine can resolve the schema. They are
// NOT traced into the standalone bundle automatically, which previously meant a
// standalone deploy had no way to apply pending migrations.
//
// NOTE: we deliberately do NOT copy the SQLite data file (prisma/db/*) here. The
// database must live on a persistent path *outside* the build output (see the
// DATABASE_URL guidance in env.example) so redeploys never overwrite/reset data.
{
  const schemaSrc = path.join(root, 'prisma', 'schema.prisma');
  const schemaDest = path.join(root, '.next', 'standalone', 'prisma', 'schema.prisma');
  if (fs.existsSync(schemaSrc)) {
    fs.mkdirSync(path.dirname(schemaDest), { recursive: true });
    fs.copyFileSync(schemaSrc, schemaDest);
    console.log(`[copy-standalone] copied ${schemaSrc} -> ${schemaDest}`);
  }
  copyDir(
    path.join(root, 'prisma', 'migrations'),
    path.join(root, '.next', 'standalone', 'prisma', 'migrations')
  );
}

console.log('[copy-standalone] done.');

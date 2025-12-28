#!/usr/bin/env node

/**
 * Migrate content from markdown files to D1 database
 *
 * Usage:
 *   Local: node scripts/migrate-content.js
 *   Remote: node scripts/migrate-content.js --remote
 *
 * This script reads the markdown content files and inserts/updates
 * the corresponding data in the D1 database.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const isRemote = process.argv.includes('--remote');
const remoteFlag = isRemote ? '--remote' : '';

console.log('\n📦 Holy Trinity CMS - Content Migration\n');
console.log(`Target: ${isRemote ? 'REMOTE (production)' : 'LOCAL (development)'} database\n`);

// Helper to execute D1 commands
function executeD1(sql) {
  const escaped = sql.replace(/"/g, '\\"');
  try {
    execSync(
      `npx wrangler d1 execute holy-trinity-cms ${remoteFlag} --command="${escaped}"`,
      { cwd: projectRoot, stdio: 'pipe' }
    );
    return true;
  } catch (error) {
    console.error(`  Error executing SQL: ${error.message}`);
    return false;
  }
}

// Parse YAML frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return { data: {}, body: content };

  const frontmatterStr = match[1];
  const body = content.slice(match[0].length).trim();

  // Simple YAML parser for our needs
  const data = {};
  let currentKey = null;
  let currentArray = null;
  let currentArrayItem = null;

  const lines = frontmatterStr.split('\n');

  for (const line of lines) {
    // Skip empty lines
    if (!line.trim()) continue;

    // Check for array item
    if (line.match(/^\s+-\s/)) {
      const itemMatch = line.match(/^\s+-\s+(\w+):\s*"?(.+?)"?$/);
      if (itemMatch && currentArray) {
        if (currentArrayItem) {
          currentArray.push(currentArrayItem);
        }
        currentArrayItem = { [itemMatch[1]]: itemMatch[2] };
      } else if (currentArrayItem) {
        const kvMatch = line.match(/^\s+(\w+):\s*"?(.+?)"?$/);
        if (kvMatch) {
          currentArrayItem[kvMatch[1]] = kvMatch[2];
        }
      }
      continue;
    }

    // Check for key: value
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      // Save previous array if exists
      if (currentArray && currentArrayItem) {
        currentArray.push(currentArrayItem);
        currentArrayItem = null;
      }
      if (currentArray) {
        data[currentKey] = currentArray;
        currentArray = null;
      }

      currentKey = kvMatch[1];
      const value = kvMatch[2].trim();

      if (value === '') {
        // Could be start of array or object
        currentArray = [];
      } else {
        // Remove quotes if present
        data[currentKey] = value.replace(/^["']|["']$/g, '');
      }
    }
  }

  // Handle final array
  if (currentArray) {
    if (currentArrayItem) {
      currentArray.push(currentArrayItem);
    }
    data[currentKey] = currentArray;
  }

  return { data, body };
}

// Escape SQL strings
function escapeSql(str) {
  if (!str) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

// Migrate vestry members
async function migrateVestry() {
  console.log('📋 Migrating Vestry members...');

  const filePath = path.join(projectRoot, 'src/content/vestry/index.md');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipped: File not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = parseFrontmatter(content);

  if (!data.members || !Array.isArray(data.members)) {
    console.log('  Skipped: No members found');
    return;
  }

  let count = 0;
  for (let i = 0; i < data.members.length; i++) {
    const member = data.members[i];
    const sql = `INSERT INTO members (group_type, name, title, term, image, sort_order) VALUES ('vestry', ${escapeSql(member.name)}, ${escapeSql(member.title)}, ${escapeSql(member.term)}, ${escapeSql(member.image)}, ${i});`;

    if (executeD1(sql)) {
      count++;
    }
  }

  console.log(`  ✅ Migrated ${count} vestry members`);
}

// Migrate music team members
async function migrateMusicTeam() {
  console.log('🎵 Migrating Music Team members...');

  const filePath = path.join(projectRoot, 'src/content/music-team/index.md');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipped: File not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = parseFrontmatter(content);

  if (!data.members || !Array.isArray(data.members)) {
    console.log('  Skipped: No members found');
    return;
  }

  let count = 0;
  for (let i = 0; i < data.members.length; i++) {
    const member = data.members[i];
    const sql = `INSERT INTO members (group_type, name, title, term, image, sort_order) VALUES ('music-team', ${escapeSql(member.name)}, ${escapeSql(member.title)}, ${escapeSql(member.term)}, ${escapeSql(member.image)}, ${i});`;

    if (executeD1(sql)) {
      count++;
    }
  }

  console.log(`  ✅ Migrated ${count} music team members`);
}

// Migrate endowment committee members
async function migrateEndowment() {
  console.log('💰 Migrating Endowment Committee members...');

  const filePath = path.join(projectRoot, 'src/content/endowment/index.md');
  if (!fs.existsSync(filePath)) {
    console.log('  Skipped: File not found');
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const { data } = parseFrontmatter(content);

  if (!data.members || !Array.isArray(data.members)) {
    console.log('  Skipped: No members found');
    return;
  }

  let count = 0;
  for (let i = 0; i < data.members.length; i++) {
    const member = data.members[i];
    const sql = `INSERT INTO members (group_type, name, title, term, image, sort_order) VALUES ('endowment', ${escapeSql(member.name)}, ${escapeSql(member.title)}, ${escapeSql(member.term)}, ${escapeSql(member.image)}, ${i});`;

    if (executeD1(sql)) {
      count++;
    }
  }

  console.log(`  ✅ Migrated ${count} endowment members`);
}

// Main migration function
async function main() {
  console.log('Starting migration...\n');

  await migrateVestry();
  await migrateMusicTeam();
  await migrateEndowment();

  console.log('\n✅ Migration complete!\n');
  console.log('You can now manage these members through the admin panel at /admin/members');
}

main().catch(console.error);

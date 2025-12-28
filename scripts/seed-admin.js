#!/usr/bin/env node

/**
 * Seed the initial admin user
 *
 * Usage:
 *   Local: node scripts/seed-admin.js
 *   Remote: node scripts/seed-admin.js --remote
 *
 * Environment variables:
 *   ADMIN_EMAIL - Admin email address
 *   ADMIN_PASSWORD - Admin password
 *   ADMIN_NAME - Admin display name (optional, defaults to "Admin")
 */

import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function main() {
  const isRemote = process.argv.includes('--remote');

  console.log('\n🔐 Holy Trinity CMS - Admin User Setup\n');
  console.log(`Target: ${isRemote ? 'REMOTE (production)' : 'LOCAL (development)'} database\n`);

  // Get admin details
  const email = process.env.ADMIN_EMAIL || await question('Admin email: ');
  const name = process.env.ADMIN_NAME || await question('Admin name (display name): ') || 'Admin';

  let password;
  if (process.env.ADMIN_PASSWORD) {
    password = process.env.ADMIN_PASSWORD;
  } else {
    password = await question('Admin password: ');
  }

  if (!email || !password) {
    console.error('❌ Email and password are required');
    process.exit(1);
  }

  // Validate password
  if (password.length < 8) {
    console.error('❌ Password must be at least 8 characters');
    process.exit(1);
  }

  // Hash the password
  console.log('\n⏳ Hashing password...');
  const passwordHash = await bcrypt.hash(password, 12);

  // Escape single quotes in the SQL
  const escapedEmail = email.replace(/'/g, "''");
  const escapedName = name.replace(/'/g, "''");
  const escapedHash = passwordHash.replace(/'/g, "''");

  const sql = `INSERT INTO users (email, password_hash, name, role, is_active) VALUES ('${escapedEmail}', '${escapedHash}', '${escapedName}', 'admin', 1);`;

  console.log('\n⏳ Creating admin user...');

  try {
    const remoteFlag = isRemote ? '--remote' : '';
    execSync(
      `npx wrangler d1 execute holy-trinity-cms ${remoteFlag} --command="${sql}"`,
      { stdio: 'inherit', cwd: process.cwd() }
    );

    console.log('\n✅ Admin user created successfully!');
    console.log(`\n📧 Email: ${email}`);
    console.log(`👤 Name: ${name}`);
    console.log(`🔑 Role: admin`);
    console.log(`\n🌐 Login at: ${isRemote ? 'https://holytrinitygillette.org' : 'http://localhost:4321'}/admin/login`);

  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      console.error('\n❌ An admin with this email already exists');
    } else {
      console.error('\n❌ Failed to create admin user:', error.message);
    }
    process.exit(1);
  }

  rl.close();
}

main().catch(console.error);

const fs = require('fs');
const path = require('path');

console.log('🔍 Pre-Flight Migration Checklist\n');
console.log('================================\n');

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

// Check 1: Environment variables
console.log('1️⃣  Checking environment variables...');
try {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    checks.failed.push('.env file not found');
  } else {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('PRISMA_DATABASE_URL') && envContent.includes('POSTGRES_URL')) {
      checks.passed.push('Environment variables configured');
    } else {
      checks.failed.push('PRISMA_DATABASE_URL or POSTGRES_URL missing in .env');
    }
  }
} catch (error) {
  checks.failed.push(`Error reading .env: ${error.message}`);
}

// Check 2: Prisma schema
console.log('2️⃣  Checking Prisma schema...');
try {
  const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
  if (!fs.existsSync(schemaPath)) {
    checks.failed.push('prisma/schema.prisma not found');
  } else {
    checks.passed.push('Prisma schema found');
  }
} catch (error) {
  checks.failed.push(`Error reading Prisma schema: ${error.message}`);
}

// Check 3: CSV files
console.log('3️⃣  Checking CSV data files...');
const csvDir = path.join(__dirname, '..', 'prisma-vercel');
const requiredCSVs = [
  'User_rows.csv',
  'Board_rows.csv',
  'Column_rows.csv',
  'Card_rows.csv',
  'Task_rows.csv'
];

let csvCount = 0;
requiredCSVs.forEach(csv => {
  const csvPath = path.join(csvDir, csv);
  if (fs.existsSync(csvPath)) {
    csvCount++;
  } else {
    checks.failed.push(`Missing CSV file: ${csv}`);
  }
});

if (csvCount === requiredCSVs.length) {
  checks.passed.push(`All ${csvCount} CSV files present`);
} else {
  checks.warnings.push(`Only ${csvCount}/${requiredCSVs.length} CSV files found`);
}

// Check 4: Node modules
console.log('4️⃣  Checking dependencies...');
const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  checks.failed.push('node_modules not found - run npm install');
} else {
  checks.passed.push('node_modules directory exists');
}

// Check 5: Prisma Client
console.log('5️⃣  Checking Prisma Client...');
const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma', 'client');
if (!fs.existsSync(prismaClientPath)) {
  checks.warnings.push('Prisma Client not generated - run npx prisma generate');
} else {
  checks.passed.push('Prisma Client generated');
}

// Check 6: csv-parse module
console.log('6️⃣  Checking csv-parse module...');
const csvParsePath = path.join(__dirname, '..', 'node_modules', 'csv-parse');
if (!fs.existsSync(csvParsePath)) {
  checks.warnings.push('csv-parse not installed - run npm install csv-parse');
} else {
  checks.passed.push('csv-parse module installed');
}

// Check 7: Migration scripts
console.log('7️⃣  Checking migration scripts...');
const scriptsDir = path.join(__dirname);
const requiredScripts = [
  'migrate-and-import.js',
  'verify-migration.js',
  'run-migration.sh'
];

let scriptCount = 0;
requiredScripts.forEach(script => {
  const scriptPath = path.join(scriptsDir, script);
  if (fs.existsSync(scriptPath)) {
    scriptCount++;
  } else {
    checks.failed.push(`Missing script: ${script}`);
  }
});

if (scriptCount === requiredScripts.length) {
  checks.passed.push(`All ${scriptCount} migration scripts present`);
}

// Check 8: Shell script permissions
console.log('8️⃣  Checking script permissions...');
const shellScriptPath = path.join(scriptsDir, 'run-migration.sh');
if (fs.existsSync(shellScriptPath)) {
  try {
    const stats = fs.statSync(shellScriptPath);
    const isExecutable = !!(stats.mode & parseInt('0100', 8));
    if (isExecutable) {
      checks.passed.push('run-migration.sh is executable');
    } else {
      checks.warnings.push('run-migration.sh not executable - run chmod +x scripts/run-migration.sh');
    }
  } catch (error) {
    checks.warnings.push(`Could not check script permissions: ${error.message}`);
  }
}

// Print results
console.log('\n================================');
console.log('📊 Pre-Flight Check Results\n');

if (checks.passed.length > 0) {
  console.log('✅ PASSED:');
  checks.passed.forEach(msg => console.log(`   ✓ ${msg}`));
  console.log('');
}

if (checks.warnings.length > 0) {
  console.log('⚠️  WARNINGS:');
  checks.warnings.forEach(msg => console.log(`   ⚠ ${msg}`));
  console.log('');
}

if (checks.failed.length > 0) {
  console.log('❌ FAILED:');
  checks.failed.forEach(msg => console.log(`   ✗ ${msg}`));
  console.log('');
}

// Final verdict
console.log('================================');
if (checks.failed.length === 0) {
  if (checks.warnings.length === 0) {
    console.log('🎉 All checks passed! You are ready to run the migration.');
    console.log('\nRun: npm run migrate:vercel\n');
    process.exit(0);
  } else {
    console.log('⚠️  Ready with warnings. Address warnings before proceeding:');
    console.log('');
    if (checks.warnings.some(w => w.includes('csv-parse'))) {
      console.log('   npm install csv-parse');
    }
    if (checks.warnings.some(w => w.includes('Prisma Client'))) {
      console.log('   npx prisma generate');
    }
    if (checks.warnings.some(w => w.includes('executable'))) {
      console.log('   chmod +x scripts/run-migration.sh');
    }
    console.log('');
    process.exit(1);
  }
} else {
  console.log('❌ Pre-flight check failed. Fix issues above before proceeding.\n');
  process.exit(1);
}

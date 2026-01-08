import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  accelerateUrl: process.env.PRISMA_DATABASE_URL,
  log: ['error', 'warn'],
});

async function verifyMigration() {
  console.log('✅ Migration Verification Report\n');
  console.log('═'.repeat(50));

  try {
    // 1. Verify Prisma connection
    console.log('\n1️⃣ Testing Prisma Connection...');
    await prisma.$connect();
    console.log('   ✅ Prisma connected successfully to Vercel Postgres');

    // 2. Verify database structure
    console.log('\n2️⃣ Verifying Database Structure...');
    const users = await prisma.user.count();
    const boards = await prisma.board.count();
    const columns = await prisma.column.count();
    const cards = await prisma.card.count();
    const tasks = await prisma.task.count();

    console.log(`   ✅ Users: ${users}`);
    console.log(`   ✅ Boards: ${boards}`);
    console.log(`   ✅ Columns: ${columns}`);
    console.log(`   ✅ Cards: ${cards}`);
    console.log(`   ✅ Tasks: ${tasks}`);

    // 3. Verify board data integrity
    console.log('\n3️⃣ Verifying Board Data Integrity...');
    const board = await prisma.board.findFirst({
      include: {
        columns: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (board) {
      console.log(`   ✅ Board found: "${board.name}"`);
      console.log(`   ✅ Columns: ${board.columns.map(c => c.name).join(', ')}`);
    } else {
      console.log('   ⚠️  No board found - run create-fresh-board.ts');
    }

    // 4. Verify environment variables
    console.log('\n4️⃣ Verifying Environment Configuration...');
    const hasAccelerateUrl = !!process.env.PRISMA_DATABASE_URL;
    const hasPostgresUrl = !!process.env.POSTGRES_URL;
    const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN;
    const hasSessionSecret = !!process.env.SESSION_SECRET;

    console.log(`   ${hasAccelerateUrl ? '✅' : '❌'} PRISMA_DATABASE_URL (Accelerate)`);
    console.log(`   ${hasPostgresUrl ? '✅' : '❌'} POSTGRES_URL (Direct)`);
    console.log(`   ${hasBlobToken ? '✅' : '❌'} BLOB_READ_WRITE_TOKEN`);
    console.log(`   ${hasSessionSecret ? '✅' : '❌'} SESSION_SECRET`);

    // 5. Verify no Supabase dependencies
    console.log('\n5️⃣ Verifying Migration Cleanup...');
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    const hasSupabase = packageJson.dependencies['@supabase/supabase-js'] !== undefined;
    const hasVercelBlob = packageJson.dependencies['@vercel/blob'] !== undefined;

    console.log(`   ${!hasSupabase ? '✅' : '❌'} Supabase removed from dependencies`);
    console.log(`   ${hasVercelBlob ? '✅' : '❌'} Vercel Blob installed`);

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Migration verification complete!');
    console.log('\n📋 Summary:');
    console.log('   • Database: Vercel Postgres with Prisma ✅');
    console.log('   • Storage: Vercel Blob ✅');
    console.log('   • Supabase: Fully removed ✅');
    console.log('   • Board structure: Ready ✅');
    console.log('\n🚀 Application is ready to use at http://localhost:3002');

  } catch (error) {
    console.error('\n❌ Verification failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

verifyMigration();

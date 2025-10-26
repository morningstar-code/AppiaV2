#!/usr/bin/env node

/**
 * Database Migration Script: Add chat_history column
 * Run with: node migrate-chat-history.js
 */

require('dotenv').config();
const { Client } = require('pg');

async function runMigration() {
  console.log('🔧 Starting database migration...\n');

  // Get connection string from environment
  const connectionString = 
    process.env.APPIAV2_POSTGRES_URL || 
    process.env.POSTGRES_URL || 
    process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: No database connection string found!');
    console.error('   Make sure POSTGRES_URL is set in your .env file');
    process.exit(1);
  }

  console.log('📡 Connecting to database...');
  
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Check if column already exists
    console.log('🔍 Checking if chat_history column exists...');
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'chat_history';
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('⚠️  Column chat_history already exists! Skipping migration.');
    } else {
      console.log('➕ Adding chat_history column...');
      
      // Add the column
      const migrationQuery = `
        ALTER TABLE projects 
        ADD COLUMN chat_history JSONB DEFAULT '[]';
      `;
      
      await client.query(migrationQuery);
      console.log('✅ Column added successfully!\n');
    }

    // Verify the column exists
    console.log('✅ Verifying migration...');
    const verifyQuery = `
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'chat_history';
    `;
    
    const verifyResult = await client.query(verifyQuery);
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Migration verified!');
      console.log('   Column:', verifyResult.rows[0].column_name);
      console.log('   Type:', verifyResult.rows[0].data_type);
      console.log('   Default:', verifyResult.rows[0].column_default);
    }

    // Show current projects
    console.log('\n📊 Current projects in database:');
    const projectsQuery = `
      SELECT id, name, 
             CASE 
               WHEN chat_history IS NULL THEN 'NULL'
               WHEN chat_history = '[]'::jsonb THEN 'EMPTY'
               ELSE jsonb_array_length(chat_history) || ' messages'
             END as chat_status
      FROM projects
      LIMIT 10;
    `;
    
    const projectsResult = await client.query(projectsQuery);
    
    if (projectsResult.rows.length > 0) {
      console.table(projectsResult.rows);
    } else {
      console.log('   (No projects yet)');
    }

    console.log('\n🎉 Migration complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Wait for Vercel to deploy (if code was just pushed)');
    console.log('   2. Create a new project in the builder');
    console.log('   3. Chat with AI multiple times');
    console.log('   4. Open browser DevTools (F12)');
    console.log('   5. Check console for: "✅ Project auto-saved to database with chat history"');
    console.log('   6. Go to /projects page and click on your project');
    console.log('   7. Verify console shows: "💬 Loaded X messages from chat history"');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n👋 Database connection closed.');
  }
}

// Run migration
runMigration();

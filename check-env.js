#!/usr/bin/env node
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

console.log('\n🔍 Environment Variable Check\n');
console.log('='.repeat(50));

const requiredVars = [
  'VITE_OPENAI_API_KEY',
  'VITE_STACK_PROJECT_ID',
  'VITE_STACK_PUBLISHABLE_CLIENT_KEY'
];

const backendVars = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
  'JWT_SECRET',
  'STACK_PROJECT_ID',
  'STACK_PUBLISHABLE_CLIENT_KEY',
  'STACK_SECRET_SERVER_KEY'
];

console.log('Frontend Environment Variables (.env):');
requiredVars.forEach(varName => {
  const value = process.env[varName];
  const status = value && !value.includes('your-') && !value.includes('here') ? '✅' : '❌';
  console.log(`  ${status} ${varName}: ${value ? (value.includes('your-') ? 'NEEDS REAL VALUE' : 'SET') : 'NOT SET'}`);
});

console.log('\nTo check backend variables, run:');
console.log('cd api-backend && node -e "require(\'dotenv\').config(); console.log(\'OPENAI_API_KEY:\', !!process.env.OPENAI_API_KEY); console.log(\'DATABASE_URL:\', !!process.env.DATABASE_URL);"');
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    
    console.log('Connection successful!');
    
    // Try a simple query
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users in the database.`);
    
  } catch (error) {
    console.error('Connection error:');
    console.error('------------------');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('------------------');
    console.error('Make sure your DATABASE_URL in .env.local is correct and includes a database name.');
    console.error('Example: mongodb+srv://username:password@cluster0.xxx.mongodb.net/your-database-name?retryWrites=true&w=majority');
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

testConnection();

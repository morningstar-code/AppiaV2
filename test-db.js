const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing database connection...\n');
  
  try {
    // Test 1: Count subscriptions
    console.log('Test 1: Checking subscriptions table...');
    const subscriptionCount = await prisma.subscription.count();
    console.log(`✅ Subscriptions in database: ${subscriptionCount}\n`);
    
    // Test 2: Count usage records
    console.log('Test 2: Checking usage table...');
    const usageCount = await prisma.usage.count();
    console.log(`✅ Usage records: ${usageCount}\n`);
    
    // Test 3: Create a test subscription (or get existing)
    console.log('Test 3: Creating/fetching test subscription...');
    const testUserId = 'test_user_' + Date.now();
    const subscription = await prisma.subscription.upsert({
      where: { userId: testUserId },
      update: {},
      create: {
        userId: testUserId,
        tier: 'free',
        tokensLimit: 108000,
        tokensUsed: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    console.log(`✅ Test subscription created:`, {
      userId: subscription.userId,
      tier: subscription.tier,
      tokensLimit: subscription.tokensLimit,
      tokensUsed: subscription.tokensUsed
    });
    console.log();
    
    // Test 4: Log a test usage event
    console.log('Test 4: Logging test usage event...');
    const usage = await prisma.usage.create({
      data: {
        userId: testUserId,
        actionType: 'test_generation',
        tokensUsed: 100,
        metadata: {
          inputTokens: 50,
          outputTokens: 50,
          model: 'test-model'
        }
      }
    });
    console.log(`✅ Usage logged:`, {
      id: usage.id,
      userId: usage.userId,
      tokensUsed: usage.tokensUsed,
      actionType: usage.actionType
    });
    console.log();
    
    // Test 5: Update subscription token count
    console.log('Test 5: Updating subscription tokens...');
    const updatedSubscription = await prisma.subscription.update({
      where: { userId: testUserId },
      data: {
        tokensUsed: { increment: 100 }
      }
    });
    console.log(`✅ Subscription updated:`, {
      userId: updatedSubscription.userId,
      tokensUsed: updatedSubscription.tokensUsed
    });
    console.log();
    
    // Clean up test data
    console.log('Cleaning up test data...');
    await prisma.usage.deleteMany({
      where: { userId: testUserId }
    });
    await prisma.subscription.delete({
      where: { userId: testUserId }
    });
    console.log('✅ Test data cleaned up\n');
    
    console.log('🎉 All database tests passed!');
    console.log('✅ Database is properly configured and ready to use.');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase();

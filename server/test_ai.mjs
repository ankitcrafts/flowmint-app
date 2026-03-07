/**
 * FlowMint AI Chat Test Script
 * Tests both Llama 3.3 (via Groq) and Gemini providers
 * Run from server directory: node C:\tmp\flowmint_ai_test.js
 */

import jwt from 'jsonwebtoken';

const API_BASE = 'http://localhost:3000';
const JWT_SECRET = 'your-secure-jwt-secret-key-021303';

// Create a test JWT token
const token = jwt.sign(
  { id: 'test-user-123', email: 'test@flowmint.com', name: 'Test User' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

console.log('═══════════════════════════════════════════════════════════');
console.log('  FlowMint AI Chat — Integration Test');
console.log('═══════════════════════════════════════════════════════════\n');

async function testHealth() {
  console.log('🔍 Test 1: Health Check');
  try {
    const res = await fetch(`${API_BASE}/`);
    const data = await res.json();
    console.log(`   Status: ${data.status}`);
    console.log(`   Groq:   ${data.providers.groq ? '✅ Active' : '❌ Missing'}`);
    console.log(`   Gemini: ${data.providers.gemini ? '✅ Active' : '❌ Missing'}`);
    console.log(`   Uptime: ${data.uptime}s\n`);
    return data;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}\n`);
    return null;
  }
}

async function testChat(message, label) {
  console.log(`🤖 ${label}`);
  console.log(`   Message: "${message}"`);
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${token}`,
      },
      body: JSON.stringify({ message }),
    });
    
    const elapsed = Date.now() - start;
    
    if (!res.ok) {
      const errText = await res.text();
      console.log(`   ❌ HTTP ${res.status}: ${errText.slice(0, 200)}\n`);
      return null;
    }
    
    const data = await res.json();
    console.log(`   Provider: ${data.provider || 'unknown'}`);
    console.log(`   Model:    ${data.model || 'unknown'}`);
    console.log(`   Category: ${data.category}`);
    console.log(`   Actionable: ${data.actionable}`);
    console.log(`   Response Time: ${data.responseTimeMs || elapsed}ms`);
    console.log(`   Fallback: ${data.fallback ? '⚠️ YES' : '✅ No'}`);
    console.log(`   Reply: ${data.reply?.slice(0, 250)}`);
    if (data.followUp) console.log(`   Follow-up: ${data.followUp}`);
    console.log();
    return data;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}\n`);
    return null;
  }
}

async function testWishPlan() {
  console.log('🎯 Test 3: Wish Plan (AI-powered saving plan)');
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/ai/wish-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${token}`,
      },
      body: JSON.stringify({
        wishName: 'MacBook Pro M4',
        price: 250000,
        currentSavings: 50000,
        monthlyIncome: 80000,
        monthlyExpenses: 40000,
        existingEMIs: 5000,
        topSpendingCategories: ['Food', 'Entertainment', 'Shopping'],
      }),
    });
    
    const elapsed = Date.now() - start;
    
    if (!res.ok) {
      const errText = await res.text();
      console.log(`   ❌ HTTP ${res.status}: ${errText.slice(0, 200)}\n`);
      return null;
    }
    
    const data = await res.json();
    console.log(`   Provider: ${data.provider || 'unknown'}`);
    console.log(`   Model:    ${data.model || 'unknown'}`);
    console.log(`   AI Tip:   ${data.aiTip?.slice(0, 200)}`);
    console.log(`   Speed Tip: ${data.speedUpTip?.slice(0, 200)}`);
    console.log(`   Months:   ${data.monthsToAfford}`);
    console.log(`   Steps:    ${data.savingSteps?.length || 0} steps`);
    if (data.savingSteps) {
      data.savingSteps.forEach((s, i) => console.log(`     ${i+1}. ${s}`));
    }
    console.log(`   Response Time: ${data.responseTimeMs || elapsed}ms`);
    console.log(`   Fallback: ${data.fallback ? '⚠️ YES' : '✅ No'}`);
    console.log();
    return data;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}\n`);
    return null;
  }
}

async function testSpendingInsight() {
  console.log('📊 Test 4: Spending Insight');
  const start = Date.now();
  try {
    const res = await fetch(`${API_BASE}/api/ai/spending-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `access_token=${token}`,
      },
      body: JSON.stringify({
        transactions: [
          { title: 'Swiggy', amount: 450, category: 'Food', type: 'debit' },
          { title: 'Netflix', amount: 649, category: 'Entertainment', type: 'debit' },
          { title: 'Amazon', amount: 2500, category: 'Shopping', type: 'debit' },
          { title: 'Zerodha', amount: 5000, category: 'Investment', type: 'debit' },
          { title: 'Salary', amount: 80000, category: 'Income', type: 'credit' },
        ],
        creditScore: 750,
        monthlyIncome: 80000,
        totalBalance: 120000,
        activeEMIs: 1,
      }),
    });
    
    const elapsed = Date.now() - start;
    
    if (!res.ok) {
      const errText = await res.text();
      console.log(`   ❌ HTTP ${res.status}: ${errText.slice(0, 200)}\n`);
      return null;
    }
    
    const data = await res.json();
    console.log(`   Provider: ${data.provider || 'unknown'}`);
    console.log(`   Model:    ${data.model || 'unknown'}`);
    console.log(`   Personality: ${data.personality}`);
    console.log(`   Tip: ${data.tip}`);
    console.log(`   Response Time: ${elapsed}ms`);
    console.log();
    return data;
  } catch (err) {
    console.log(`   ❌ FAILED: ${err.message}\n`);
    return null;
  }
}

// ─── Run All Tests ────────────────────────────────────────
async function runAllTests() {
  const results = { passed: 0, failed: 0, total: 0 };
  
  const health = await testHealth();
  results.total++;
  if (health?.status === 'ok') results.passed++; else results.failed++;
  
  const chat1 = await testChat(
    'How can I improve my CIBIL score from 680 to 750?',
    'Test 2a: Chat — CIBIL Score Question'
  );
  results.total++;
  if (chat1?.reply && !chat1.fallback) results.passed++; else results.failed++;
  
  const chat2 = await testChat(
    'I earn 60k per month. How much should I save and invest?',
    'Test 2b: Chat — Savings Advice'
  );
  results.total++;
  if (chat2?.reply && !chat2.fallback) results.passed++; else results.failed++;
  
  const wish = await testWishPlan();
  results.total++;
  if (wish?.aiTip && !wish.fallback) results.passed++; else results.failed++;
  
  const insight = await testSpendingInsight();
  results.total++;
  if (insight?.personality) results.passed++; else results.failed++;
  
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RESULTS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Total:  ${results.total}`);
  console.log(`  Passed: ${results.passed} ✅`);
  console.log(`  Failed: ${results.failed} ${results.failed > 0 ? '❌' : ''}`);
  console.log();
  
  const providers = [chat1, chat2, wish, insight].filter(Boolean);
  const groqCount = providers.filter(p => p.provider === 'groq').length;
  const geminiCount = providers.filter(p => p.provider === 'gemini').length;
  const fallbackCount = providers.filter(p => p.provider === 'fallback' || p.provider === 'local').length;
  
  console.log('  Provider Breakdown:');
  if (groqCount > 0) console.log(`    Groq (Llama 3.3):  ${groqCount}/${providers.length} calls ✅`);
  if (geminiCount > 0) console.log(`    Gemini:            ${geminiCount}/${providers.length} calls 🔄`);
  if (fallbackCount > 0) console.log(`    Fallback/Static:   ${fallbackCount}/${providers.length} calls ⚠️`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

runAllTests();

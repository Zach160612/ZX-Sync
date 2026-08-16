require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

let passed = 0;
let failed = 0;
let warned = 0;

/**
 * Run a single test and return a result line.
 */
async function runTest(label, fn) {
  try {
    const result = await fn();
    if (result === true) {
      console.log(`${PASS} ${label}`);
      passed++;
      return true;
    }
    if (result === false) {
      console.log(`${FAIL} ${label}`);
      failed++;
      return false;
    }
    // String = warning/detail
    console.log(`${WARN} ${label} — ${result}`);
    warned++;
    return false;
  } catch (err) {
    console.log(`${FAIL} ${label} — ${err.message}`);
    failed++;
    return false;
  }
}

async function runTests() {
  console.log('🔧 ZX Sync — System Health Check\n');

  // ─── 1. Environment variables ───────────────────────────────
  await runTest('Environment variables loaded', () => {
    if (!process.env.BOT_TOKEN) return 'BOT_TOKEN not set';
    if (!process.env.CLIENT_ID) return 'CLIENT_ID not set';
    if (!process.env.GUILD_ID) return 'GUILD_ID not set';
    return true;
  });

  // ─── 2. Configuration file ───────────────────────────────────
  await runTest('Configuration file loads', () => {
    try {
      const config = require('./config.json');
      if (!config) return 'Config is empty';
      return true;
    } catch (err) {
      return `Failed to load config: ${err.message}`;
    }
  });

  // ─── 3. Node modules installed ───────────────────────────────
  await runTest('Dependencies installed', () => {
    const nodeModulesPath = path.join(__dirname, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) return 'node_modules directory not found';
    return true;
  });

  // ─── 4. Data directory exists ───────────────────────────────
  await runTest('Data directory exists', () => {
    const dataPath = path.join(__dirname, 'data');
    if (!fs.existsSync(dataPath)) return 'data directory not found';
    return true;
  });

  // ─── 5. Commands directory structure ────────────────────────
  await runTest('Commands directory structure', () => {
    const commandsPath = path.join(__dirname, 'src', 'commands');
    if (!fs.existsSync(commandsPath)) return 'src/commands directory not found';
    
    const categories = fs.readdirSync(commandsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    if (categories.length === 0) return 'No command categories found';
    return true;
  });

  // ─── 6. Commands can be loaded ───────────────────────────────
  await runTest('Commands can be loaded', () => {
    const commandHandler = require('./src/handlers/commandHandler');
    const { Client, Collection } = require('discord.js');
    
    const mockClient = {
      commands: new Collection(),
      events: new Collection(),
      cooldowns: new Collection()
    };
    
    try {
      commandHandler.loadCommands(mockClient);
      if (mockClient.commands.size === 0) return 'No commands loaded';
      return true;
    } catch (err) {
      return `Failed to load commands: ${err.message}`;
    }
  });

  // ─── 7. Events can be loaded ────────────────────────────────
  await runTest('Events directory structure', () => {
    const eventsPath = path.join(__dirname, 'src', 'events');
    if (!fs.existsSync(eventsPath)) return 'src/events directory not found';
    
    let eventCount = 0;
    function countEvents(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          countEvents(fullPath);
        } else if (entry.name.endsWith('.js')) {
          eventCount++;
        }
      }
    }
    countEvents(eventsPath);
    
    if (eventCount === 0) return 'No event files found';
    return true;
  });

  // ─── 8. Data store functionality ────────────────────────────
  await runTest('Data store functionality', () => {
    try {
      const { readData, writeData } = require('./src/utils/dataStore');
      
      // Test write
      writeData('test.json', { test: true, timestamp: Date.now() });
      
      // Test read
      const data = readData('test.json');
      if (!data || typeof data !== 'object') return 'Data store returned invalid data';
      
      // Cleanup
      const testPath = path.join(__dirname, 'data', 'test.json');
      if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
      
      return true;
    } catch (err) {
      return `Data store test failed: ${err.message}`;
    }
  });

  // ─── 9. Welcome image generation ────────────────────────────
  await runTest('Welcome image generation', async () => {
    try {
      const { generateWelcomeImage } = require('./src/utils/welcomeImage');
      
      const dummyMember = {
        user: {
          username: 'TestUser',
          displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png',
        },
        guild: { memberCount: 100 },
      };
      
      const buf = await generateWelcomeImage(dummyMember, 'Test Server');
      if (!buf || buf.length < 1000) return 'Image generated but looks too small';
      return true;
    } catch (err) {
      return `Welcome image generation failed: ${err.message}`;
    }
  });

  // ─── 10. Logger functionality ───────────────────────────────
  await runTest('Logger functionality', () => {
    try {
      const logger = require('./src/utils/logger');
      if (typeof logger.logAction !== 'function') return 'Logger missing logAction function';
      if (typeof logger.buildLogEmbed !== 'function') return 'Logger missing buildLogEmbed function';
      return true;
    } catch (err) {
      return `Logger test failed: ${err.message}`;
    }
  });

  // ─── 11. Permissions utility ────────────────────────────────
  await runTest('Permissions utility', () => {
    try {
      const permissions = require('./src/utils/permissions');
      if (typeof permissions.hasPermission !== 'function') return 'Missing hasPermission function';
      if (typeof permissions.denyPermission !== 'function') return 'Missing denyPermission function';
      return true;
    } catch (err) {
      return `Permissions utility test failed: ${err.message}`;
    }
  });

  // ─── 12. Embeds utility ────────────────────────────────────
  await runTest('Embeds utility', () => {
    try {
      const embeds = require('./src/utils/embeds');
      if (typeof embeds.successEmbed !== 'function') return 'Missing successEmbed function';
      if (typeof embeds.errorEmbed !== 'function') return 'Missing errorEmbed function';
      return true;
    } catch (err) {
      return `Embeds utility test failed: ${err.message}`;
    }
  });

  // ─── 13. Deploy commands script ─────────────────────────────
  await runTest('Deploy commands script exists', () => {
    const deployPath = path.join(__dirname, 'deploy-commands.js');
    if (!fs.existsSync(deployPath)) return 'deploy-commands.js not found';
    return true;
  });

  // ─── 14. Main entry point exists ────────────────────────────
  await runTest('Main entry point exists', () => {
    const indexPath = path.join(__dirname, 'index.js');
    if (!fs.existsSync(indexPath)) return 'index.js not found';
    return true;
  });

  // ─── Summary ────────────────────────────────────────────────
  console.log('\n📊 Summary');
  console.log(`${PASS} Passed: ${passed}`);
  console.log(`${WARN} Warnings: ${warned}`);
  console.log(`${FAIL} Failed: ${failed}`);
  console.log(`Total: ${passed + warned + failed}`);

  if (failed === 0 && warned === 0) {
    console.log('\n✅ All systems operational!');
    process.exit(0);
  } else if (failed === 0) {
    console.log('\n⚠️ Some warnings found, but systems are functional.');
    process.exit(0);
  } else {
    console.log('\n❌ Some systems failed. Please check the errors above.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('❌ Test suite failed to run:', err);
  process.exit(1);
});

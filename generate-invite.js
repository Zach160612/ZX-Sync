require('dotenv').config();

const CLIENT_ID = process.env.CLIENT_ID;

if (!CLIENT_ID) {
  console.error('❌ CLIENT_ID is missing from your .env file');
  process.exit(1);
}

// Administrator — covers Manage Roles, Channels, Messages, Kick/Ban, etc.
const PERMISSIONS = '8';

const inviteUrl = new URL('https://discord.com/api/oauth2/authorize');
inviteUrl.searchParams.set('client_id', CLIENT_ID);
inviteUrl.searchParams.set('permissions', PERMISSIONS);
inviteUrl.searchParams.set('scope', 'bot applications.commands');

console.log('\n🔗 ZX Sync invite link (use this for every server):\n');
console.log(inviteUrl.toString());
console.log('\nRequired scopes: bot + applications.commands');
console.log('If the bot says it joined but is missing from the member list, you used the wrong link.');
console.log('Do NOT use an "Install App" / user-install link — that adds commands without adding the bot.\n');

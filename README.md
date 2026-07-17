# ZX Sync — Discord Bot

A clean, professional Discord management bot for private servers. Built with **Discord.js v14** using slash commands, embeds, buttons, and select menus.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Your bot token from the [Discord Developer Portal](https://discord.com/developers/applications) |
| `CLIENT_ID` | Your bot's Application ID |
| `GUILD_ID` | Your Discord server ID |

### 3. Configure the Bot

Edit `config.json` and fill in your server's channel and role IDs:

```json
{
  "staffRoles": ["Owner", "Administrator", "Moderator"],
  "channels": {
    "log": "YOUR_LOG_CHANNEL_ID",
    "welcome": "YOUR_WELCOME_CHANNEL_ID",
    "goodbye": "YOUR_GOODBYE_CHANNEL_ID"
  },
  "autoRole": "YOUR_AUTO_ROLE_ID",
  "ticketSupportRole": "YOUR_SUPPORT_ROLE_ID"
}
```

### 4. Deploy Slash Commands

Run this **once** (and whenever you add/change commands):

```bash
npm run deploy
```

### 5. Start the Bot

```bash
npm start
```

---

## 📋 Commands

### Information *(Everyone)*
| Command | Description |
|---|---|
| `/help` | Show all available commands |
| `/info` | Display bot information |
| `/ping` | Check bot latency |

### Moderation *(Staff only)*
| Command | Description |
|---|---|
| `/ban @user [reason]` | Ban a member |
| `/kick @user [reason]` | Kick a member |
| `/warn @user reason` | Warn a member |
| `/warnings @user` | View a member's warnings |
| `/timeout @user duration unit [reason]` | Timeout a member |
| `/purge amount` | Delete up to 100 messages |
| `/lock [#channel]` | Lock a channel |
| `/unlock [#channel]` | Unlock a channel |

### Role Management *(Staff only)*
| Command | Description |
|---|---|
| `/role create name [color]` | Create a new role |
| `/role delete @role` | Delete a role |
| `/role color @role #hex` | Change a role's color |
| `/role give @user @role` | Give a role to a member |
| `/role remove @user @role` | Remove a role from a member |

### Events *(Staff only)*
| Command | Description |
|---|---|
| `/event create` | Create an event with RSVP buttons |
| `/event edit id` | Edit an event |
| `/event delete id` | Delete an event |
| `/events` | List all upcoming events |

### Tickets *(Staff only)*
| Command | Description |
|---|---|
| `/ticket setup #channel` | Post the ticket panel |
| `/ticket close` | Close the current ticket |
| `/ticket transcript` | Export ticket as HTML |

### Utilities *(Staff only)*
| Command | Description |
|---|---|
| `/poll question type` | Create a poll |
| `/giveaway prize duration winners` | Start a giveaway |
| `/embed title description` | Build a custom embed |
| `/welcome message` | Set the welcome message for new members |
| `/welcome channel` | Set the welcome channel |
| `/welcome type` | Set welcome type (image or text) |
| `/welcome enable` | Enable the welcome system |
| `/welcome disable` | Disable the welcome system |

---

## ⚙️ Automated Features

- **Welcome System** — Sends a custom embed when a member joins. Supports username, server name, and member count. Auto-role support.
- **Goodbye System** — Sends a goodbye embed when a member leaves.
- **Event Reminders** — Automatically sends reminders 24h, 1h, and 15m before an event.
- **Giveaway Auto-End** — Automatically picks winners when the timer expires.
- **Logging** — Logs deleted/edited messages, member joins/leaves, role updates, nickname changes, bans, kicks, channel creation/deletion.

---

## 📂 Project Structure

```
ZX Sync/
├── index.js              # Entry point
├── deploy-commands.js    # Register slash commands
├── config.json           # Server configuration
├── data/                 # JSON data persistence
│   ├── warnings.json
│   ├── events.json
│   ├── tickets.json
│   └── giveaways.json
└── src/
    ├── commands/         # All slash commands
    ├── events/           # Discord event handlers
    ├── handlers/         # Command & event loaders
    └── utils/            # Shared utilities
```

---

## 🔐 Permission System

The bot uses role-based access control:

- **Full Access**: Server Owner, members with Administrator permission, or members with a role named `Owner`, `Administrator`, or `Moderator` (configurable in `config.json`)
- **Member Access**: `/help`, `/info`, `/ping` only

Unauthorized command attempts return an ephemeral ❌ error.

---

## 🤖 Bot Permissions Required

Make sure your bot has the following permissions in your server:

- `Administrator` (recommended for full functionality)

Or individually:
- `Manage Channels`, `Manage Roles`, `Manage Messages`
- `Kick Members`, `Ban Members`, `Moderate Members`
- `View Audit Log`, `Send Messages`, `Embed Links`
- `Read Message History`, `View Channel`

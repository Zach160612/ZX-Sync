const { createCanvas, loadImage } = require('canvas');

/**
 * Helper to draw a rounded rectangle.
 */
function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function generateWelcomeImage(member, serverName) {
  // 1800 x 720 (High-DPI Retina resolution for crystal clear rendering)
  const width = 1800;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Enable high quality anti-aliasing & image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Dark Premium Gaming Gradient Background
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#090a10');
  bgGradient.addColorStop(0.4, '#111425');
  bgGradient.addColorStop(1, '#0a0c16');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Glowing Ambient Neon Orbs
  // Purple Glowing Orb (Top Left)
  const orb1 = ctx.createRadialGradient(300, 160, 20, 300, 160, 600);
  orb1.addColorStop(0, 'rgba(168, 85, 247, 0.45)');
  orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb1;
  ctx.beginPath();
  ctx.arc(300, 160, 600, 0, Math.PI * 2);
  ctx.fill();

  // Blurple/Cyan Glowing Orb (Bottom Right)
  const orb2 = ctx.createRadialGradient(1500, 560, 20, 1500, 560, 600);
  orb2.addColorStop(0, 'rgba(88, 101, 242, 0.5)');
  orb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb2;
  ctx.beginPath();
  ctx.arc(1500, 560, 600, 0, Math.PI * 2);
  ctx.fill();

  // 3. Central Glassmorphic Card (Rounded & Border Glow)
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  roundRect(ctx, 60, 60, width - 120, height - 120, 40);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Ultra Crisp Avatar (512px / 1024px PNG)
  const avatarX = 280;
  const avatarY = height / 2;
  const avatarRadius = 150;

  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 1024 });
    const avatar = await loadImage(avatarUrl);

    // Glowing Neon Ring Outer Border
    ctx.save();
    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 40;
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Clip & Draw Avatar Image
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } catch (err) {
    console.error('Failed to load avatar image:', err.message);
  }

  // 5. Typography & Text Section
  const textX = 520;

  // "👋 WELCOME TO THE SERVER" Pill Badge
  ctx.save();
  ctx.fillStyle = 'rgba(88, 101, 242, 0.3)';
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.6)';
  ctx.lineWidth = 2;
  roundRect(ctx, textX, 150, 420, 64, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#c7d2fe';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('👋 WELCOME TO THE SERVER', textX + 24, 192);
  ctx.restore();

  // Username (Crisp White Bold with Drop Shadow)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 72px sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 20;
  const username = member.user.username.length > 18 ? member.user.username.substring(0, 18) + '...' : member.user.username;
  ctx.fillText(username, textX, 330);
  ctx.restore();

  // Server Name (Vibrant Blurple Text)
  ctx.save();
  const serverText = serverName.length > 24 ? serverName.substring(0, 24) + '...' : serverName;
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 48px sans-serif';
  ctx.shadowColor = 'rgba(88, 101, 242, 0.5)';
  ctx.shadowBlur = 15;
  ctx.fillText(serverText, textX, 420);
  ctx.restore();

  // Sub-message
  ctx.fillStyle = '#94a3b8';
  ctx.font = '32px sans-serif';
  ctx.fillText("We're glad to have you here with us!", textX, 490);

  // 6. Member Count Pill Badge (Bottom Right)
  ctx.save();
  const countText = `MEMBER #${member.guild.memberCount}`;
  ctx.font = 'bold 28px sans-serif';
  const textWidth = ctx.measureText(countText).width;
  const badgeW = textWidth + 48;
  const badgeH = 64;
  const badgeX = width - 140 - badgeW;
  const badgeY = height - 150;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 2;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 32);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(countText, badgeX + 24, badgeY + 43);
  ctx.restore();

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeImage };

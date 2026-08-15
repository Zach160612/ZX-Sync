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
  const width = 900;
  const height = 360;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // 1. Dark Neon Gaming Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, width, height);
  bgGradient.addColorStop(0, '#090a0f');
  bgGradient.addColorStop(0.5, '#121526');
  bgGradient.addColorStop(1, '#0b0d18');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 2. Decorative Ambient Glowing Orbs
  // Purple Orb Top Left
  const orb1 = ctx.createRadialGradient(150, 80, 10, 150, 80, 300);
  orb1.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
  orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb1;
  ctx.beginPath();
  ctx.arc(150, 80, 300, 0, Math.PI * 2);
  ctx.fill();

  // Cyan/Blurple Orb Bottom Right
  const orb2 = ctx.createRadialGradient(750, 280, 10, 750, 280, 300);
  orb2.addColorStop(0, 'rgba(88, 101, 242, 0.4)');
  orb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = orb2;
  ctx.beginPath();
  ctx.arc(750, 280, 300, 0, Math.PI * 2);
  ctx.fill();

  // 3. Central Glassmorphic Card Container
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, 30, 30, width - 60, height - 60, 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // 4. Draw Avatar with Glowing Ring
  const avatarX = 140;
  const avatarY = height / 2;
  const avatarRadius = 75;

  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256 });
    const avatar = await loadImage(avatarUrl);

    // Glowing Outer Ring
    ctx.save();
    ctx.shadowColor = '#5865F2';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Clip & Draw Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();
  } catch (err) {
    console.error('Failed to render avatar image:', err.message);
  }

  // 5. Welcome Text Section
  const textX = 260;

  // "WELCOME TO THE SERVER" Badge
  ctx.save();
  ctx.fillStyle = 'rgba(88, 101, 242, 0.25)';
  ctx.strokeStyle = 'rgba(88, 101, 242, 0.5)';
  ctx.lineWidth = 1;
  roundRect(ctx, textX, 75, 210, 32, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('👋 WELCOME TO THE SERVER', textX + 12, 96);
  ctx.restore();

  // User Name (White Bold with Shadow)
  ctx.save();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  const username = member.user.username.length > 18 ? member.user.username.substring(0, 18) + '...' : member.user.username;
  ctx.fillText(username, textX, 165);
  ctx.restore();

  // Server Name (Gradient Blurple Text)
  ctx.save();
  const serverText = serverName.length > 24 ? serverName.substring(0, 24) + '...' : serverName;
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(serverText, textX, 210);
  ctx.restore();

  // Sub-description
  ctx.fillStyle = '#94a3b8';
  ctx.font = '16px sans-serif';
  ctx.fillText("We're glad to have you here with us!", textX, 245);

  // 6. Member Count Pill Badge (Bottom Right)
  ctx.save();
  const countText = `MEMBER #${member.guild.memberCount}`;
  ctx.font = 'bold 14px sans-serif';
  const textWidth = ctx.measureText(countText).width;
  const badgeW = textWidth + 24;
  const badgeH = 32;
  const badgeX = width - 70 - badgeW;
  const badgeY = height - 75;

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  roundRect(ctx, badgeX, badgeY, badgeW, badgeH, 16);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.fillText(countText, badgeX + 12, badgeY + 21);
  ctx.restore();

  return canvas.toBuffer();
}

module.exports = { generateWelcomeImage };

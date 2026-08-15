const { createCanvas, loadImage } = require('canvas');

async function generateWelcomeImage(member, serverName) {
  // Use 2x High-DPI Retina scale (1600 x 600) so the original design is crystal clear
  const scale = 2;
  const baseWidth = 800;
  const baseHeight = 300;
  
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Scale context so we can use exact 800x300 coordinates with 2x sharpness
  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Original Dark Navy Gradient Background
  const gradient = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
  gradient.addColorStop(0, '#16192b');
  gradient.addColorStop(1, '#111322');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, baseWidth, baseHeight);

  // 2. Original Avatar (Center X: 150, Center Y: 150, Radius: 80)
  const avatarX = 150;
  const avatarY = 150;
  const avatarRadius = 80;

  try {
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 512 });
    const avatar = await loadImage(avatarUrl);

    // Clip & Draw Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.restore();

    // Original Blurple Border Around Avatar
    ctx.save();
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.restore();
  } catch (err) {
    console.error('Failed to load avatar:', err.message);
  }

  // 3. Text Section (Starting X: 280)
  const textX = 280;

  // Username (White Bold 36px)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  const username = member.user.username.length > 20 ? member.user.username.substring(0, 20) + '...' : member.user.username;
  ctx.fillText(username, textX, 120);

  // "Welcome to" (White Bold 28px)
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Welcome to', textX, 190);

  // Server Name (Blurple Bold 28px)
  ctx.fillStyle = '#5865F2';
  ctx.font = 'bold 28px sans-serif';
  const displayServer = serverName.length > 25 ? serverName.substring(0, 25) + '...' : serverName;
  ctx.fillText(displayServer, textX, 225);

  // Sub-message (Grey 18px)
  ctx.fillStyle = '#99aab5';
  ctx.font = '18px sans-serif';
  ctx.fillText("We're glad you're here!", textX, 260);

  // Member Count (White 16px)
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText(`Member #${member.guild.memberCount}`, textX, 285);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeImage };

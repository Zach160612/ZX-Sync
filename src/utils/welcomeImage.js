const { createCanvas, loadImage } = require('canvas');

/**
 * Render background image or fallback gradient onto context
 */
async function drawBackground(ctx, baseWidth, baseHeight, customBgUrl, defaultGradientColors) {
  let loadedCustom = false;

  if (customBgUrl) {
    try {
      const bgImg = await loadImage(customBgUrl);
      ctx.drawImage(bgImg, 0, 0, baseWidth, baseHeight);
      
      // Add a subtle dark overlay for high text contrast
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
      ctx.restore();
      
      loadedCustom = true;
    } catch (err) {
      console.error('Failed to load custom background image:', err.message);
    }
  }

  if (!loadedCustom) {
    const gradient = ctx.createLinearGradient(0, 0, baseWidth, baseHeight);
    gradient.addColorStop(0, defaultGradientColors[0]);
    gradient.addColorStop(1, defaultGradientColors[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, baseWidth, baseHeight);
  }
}

async function generateWelcomeImage(member, serverName, customBgUrl = null) {
  const scale = 2;
  const baseWidth = 800;
  const baseHeight = 300;
  
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background (Custom image or Dark Navy Tech Gradient)
  await drawBackground(ctx, baseWidth, baseHeight, customBgUrl, ['#0d1117', '#161b22']);

  // Tech Grid / Accent Lines
  ctx.save();
  ctx.strokeStyle = 'rgba(88, 101, 242, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < baseWidth; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, baseHeight);
    ctx.stroke();
  }
  ctx.restore();

  // Tech Badge Top-Right
  ctx.save();
  ctx.fillStyle = 'rgba(88, 101, 242, 0.2)';
  ctx.roundRect ? ctx.roundRect(baseWidth - 190, 20, 170, 28, 6) : ctx.fillRect(baseWidth - 190, 20, 170, 28);
  ctx.fill();
  ctx.strokeStyle = '#5865F2';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#5865F2';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('⚡ TECH COMMUNITY', baseWidth - 175, 38);
  ctx.restore();

  // 2. Avatar (Center X: 150, Center Y: 150, Radius: 80)
  const avatarX = 150;
  const avatarY = 150;
  const avatarRadius = 80;
  let avatarLoaded = false;

  try {
    const avatarUrl = member.user.displayAvatarURL ? member.user.displayAvatarURL({ extension: 'png', size: 512 }) : null;
    if (avatarUrl) {
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.restore();
      avatarLoaded = true;
    }
  } catch (err) {
    console.error('Failed to load avatar:', err.message);
  }

  if (!avatarLoaded) {
    // Fallback Initial Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = '#1f2438';
    ctx.fill();
    ctx.fillStyle = '#5865F2';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = (member.user.username || 'U').charAt(0).toUpperCase();
    ctx.fillText(initial, avatarX, avatarY);
    ctx.restore();
  }

  // Blurple Border Around Avatar
  ctx.save();
  ctx.strokeStyle = '#5865F2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.restore();

  // 3. Text Section (Starting X: 280)
  const textX = 280;

  // Username (White Bold 36px)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  const username = member.user.username.length > 20 ? member.user.username.substring(0, 20) + '...' : member.user.username;
  ctx.fillText(username, textX, 115);

  // "Welcome to" (White Bold 26px)
  ctx.fillStyle = '#8b949e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('WELCOME TO', textX, 175);

  // Server Name (Blurple Bold 28px)
  ctx.fillStyle = '#5865F2';
  ctx.font = 'bold 28px sans-serif';
  const displayServer = serverName.length > 25 ? serverName.substring(0, 25) + '...' : serverName;
  ctx.fillText(displayServer, textX, 215);

  // Sub-message (Grey 18px)
  ctx.fillStyle = '#c9d1d9';
  ctx.font = '18px sans-serif';
  ctx.fillText("We're excited to have you in our tech workspace! 🚀", textX, 250);

  // Member Count (White 16px)
  ctx.fillStyle = '#8b949e';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Member #${member.guild?.memberCount || '?'}`, textX, 275);

  return canvas.toBuffer('image/png');
}

async function generateGoodbyeImage(member, serverName, customBgUrl = null) {
  const scale = 2;
  const baseWidth = 800;
  const baseHeight = 300;
  
  const width = baseWidth * scale;
  const height = baseHeight * scale;

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Background (Custom image or Dark Red Tech Gradient)
  await drawBackground(ctx, baseWidth, baseHeight, customBgUrl, ['#160b0d', '#231013']);

  // Tech Grid / Accent Lines (Red theme)
  ctx.save();
  ctx.strokeStyle = 'rgba(237, 66, 69, 0.15)';
  ctx.lineWidth = 1;
  for (let x = 0; x < baseWidth; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, baseHeight);
    ctx.stroke();
  }
  ctx.restore();

  // Tech Badge Top-Right
  ctx.save();
  ctx.fillStyle = 'rgba(237, 66, 69, 0.2)';
  ctx.roundRect ? ctx.roundRect(baseWidth - 190, 20, 170, 28, 6) : ctx.fillRect(baseWidth - 190, 20, 170, 28);
  ctx.fill();
  ctx.strokeStyle = '#ED4245';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#ED4245';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('💻 TECH ALUMNI', baseWidth - 170, 38);
  ctx.restore();

  // 2. Avatar (Center X: 150, Center Y: 150, Radius: 80)
  const avatarX = 150;
  const avatarY = 150;
  const avatarRadius = 80;
  let avatarLoaded = false;

  try {
    const avatarUrl = member.user.displayAvatarURL ? member.user.displayAvatarURL({ extension: 'png', size: 512 }) : null;
    if (avatarUrl) {
      const avatar = await loadImage(avatarUrl);
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
      ctx.restore();
      avatarLoaded = true;
    }
  } catch (err) {
    console.error('Failed to load avatar:', err.message);
  }

  if (!avatarLoaded) {
    // Fallback Initial Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = '#30181b';
    ctx.fill();
    ctx.fillStyle = '#ED4245';
    ctx.font = 'bold 64px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initial = (member.user.username || 'U').charAt(0).toUpperCase();
    ctx.fillText(initial, avatarX, avatarY);
    ctx.restore();
  }

  // Crimson/Red Border Around Avatar
  ctx.save();
  ctx.strokeStyle = '#ED4245';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2, true);
  ctx.stroke();
  ctx.restore();

  // 3. Text Section (Starting X: 280)
  const textX = 280;

  // Username (White Bold 36px)
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px sans-serif';
  const username = member.user.username.length > 20 ? member.user.username.substring(0, 20) + '...' : member.user.username;
  ctx.fillText(username, textX, 115);

  // "Goodbye from" (Grey 24px)
  ctx.fillStyle = '#8b949e';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('GOODBYE FROM', textX, 175);

  // Server Name (Red Bold 28px)
  ctx.fillStyle = '#ED4245';
  ctx.font = 'bold 28px sans-serif';
  const displayServer = serverName.length > 25 ? serverName.substring(0, 25) + '...' : serverName;
  ctx.fillText(displayServer, textX, 215);

  // Sub-message (Grey 18px)
  ctx.fillStyle = '#c9d1d9';
  ctx.font = '18px sans-serif';
  ctx.fillText("We wish you the best in your tech journey! 👋", textX, 250);

  // Member Count (White 15px)
  ctx.fillStyle = '#8b949e';
  ctx.font = '15px sans-serif';
  ctx.fillText(`Member #${member.guild?.memberCount || '?'}`, textX, 275);

  return canvas.toBuffer('image/png');
}

module.exports = { generateWelcomeImage, generateGoodbyeImage };


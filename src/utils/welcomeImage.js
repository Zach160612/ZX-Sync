const { createCanvas, loadImage } = require('canvas');
const path = require('path');

async function generateWelcomeImage(member, serverName) {
  const canvas = createCanvas(800, 300);
  const ctx = canvas.getContext('2d');

  // Background - dark gradient
  const gradient = ctx.createLinearGradient(0, 0, 800, 300);
  gradient.addColorStop(0, '#1a1a2e');
  gradient.addColorStop(1, '#16213e');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 800, 300);

  // Load and draw user avatar
  try {
    const avatar = await loadImage(member.user.displayAvatarURL({ extension: 'png', size: 256 }));
    
    // Create circular clip for avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    
    ctx.drawImage(avatar, 70, 70, 160, 160);
    ctx.restore();

    // Add border around avatar
    ctx.strokeStyle = '#5865F2';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(150, 150, 80, 0, Math.PI * 2, true);
    ctx.stroke();
  } catch (err) {
    console.error('Failed to load avatar:', err);
  }

  // Draw username
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px Arial';
  ctx.fillText(member.user.username, 280, 120);

  // Draw discriminator if available
  if (member.user.discriminator && member.user.discriminator !== '0') {
    ctx.fillStyle = '#99aab5';
    ctx.font = '24px Arial';
    ctx.fillText(`#${member.user.discriminator}`, 280, 150);
  }

  // Draw welcome message
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Arial';
  ctx.fillText('Welcome to', 280, 190);

  // Draw server name
  ctx.fillStyle = '#5865F2';
  ctx.font = 'bold 28px Arial';
  ctx.fillText(serverName, 280, 225);

  // Draw sub-message
  ctx.fillStyle = '#99aab5';
  ctx.font = '18px Arial';
  ctx.fillText("We're glad you're here!", 280, 260);

  // Member count
  ctx.fillStyle = '#ffffff';
  ctx.font = '16px Arial';
  ctx.fillText(`Member #${member.guild.memberCount}`, 280, 285);

  return canvas.toBuffer();
}

module.exports = { generateWelcomeImage };

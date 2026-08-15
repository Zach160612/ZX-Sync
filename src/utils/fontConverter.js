/**
 * Convert standard ASCII text to Mathematical Bold Serif font (e.g., "Zach" -> "𝐙𝐚𝐜𝐡").
 * @param {string} text
 * @returns {string}
 */
function toMathematicalBold(text) {
  if (!text) return '';

  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0);

      // Uppercase A-Z (ASCII 65 - 90) -> U+1D400 to U+1D419
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(0x1d400 + (code - 65));
      }

      // Lowercase a-z (ASCII 97 - 122) -> U+1D41A to U+1D433
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(0x1d41a + (code - 97));
      }

      // Digits 0-9 (ASCII 48 - 57) -> U+1D7CE to U+1D7D7
      if (code >= 48 && code <= 57) {
        return String.fromCodePoint(0x1d7ce + (code - 48));
      }

      // Return unchanged for symbols, spaces, or emojis
      return char;
    })
    .join('');
}

module.exports = { toMathematicalBold };

/**
 * Generates a random 4-digit discriminator tag (1000 - 9999).
 */
export function generateTag(): string {
  const min = 1000;
  const max = 9999;
  return Math.floor(Math.random() * (max - min + 1) + min).toString();
}

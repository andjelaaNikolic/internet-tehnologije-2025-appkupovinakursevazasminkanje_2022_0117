import Tokens from 'csrf';

const tokens = new Tokens();

export function generateCsrfToken(secret: string) {
  return tokens.create(secret);
}

export function verifyCsrfToken(secret: string, token: string) {
  return tokens.verify(secret, token);
}
const ROOM_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROOM_CODE_LENGTH = 6;

export function generateRoomCode(length = ROOM_CODE_LENGTH): string {
  let code = '';

  for (let index = 0; index < length; index += 1) {
    const charIndex = Math.floor(Math.random() * ROOM_CODE_ALPHABET.length);
    code += ROOM_CODE_ALPHABET[charIndex];
  }

  return code;
}

export function isRoomCodeFormatValid(roomCode: string): boolean {
  return /^[A-Z2-9]{6}$/.test(roomCode);
}

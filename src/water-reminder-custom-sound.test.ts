import { describe, expect, it } from 'vitest';
import { MAX_CUSTOM_SOUND_BYTES, validateCustomSound } from './water-reminder-custom-sound';

describe('validateCustomSound', () => {
  it('aceita áudio pequeno', () => {
    expect(validateCustomSound({ type: 'audio/mpeg', size: 120_000 })).toBeNull();
  });
  it('recusa arquivos que não são áudio', () => {
    expect(validateCustomSound({ type: 'image/png', size: 1000 })).toMatch(/áudio/);
    expect(validateCustomSound({ type: '', size: 1000 })).not.toBeNull();
  });
  it('recusa vazio e acima do limite', () => {
    expect(validateCustomSound({ type: 'audio/ogg', size: 0 })).toMatch(/vazio/);
    expect(validateCustomSound({ type: 'audio/ogg', size: MAX_CUSTOM_SOUND_BYTES + 1 })).toMatch(/2 MB/);
    expect(validateCustomSound({ type: 'audio/ogg', size: MAX_CUSTOM_SOUND_BYTES })).toBeNull();
  });
});

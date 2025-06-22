
import { useCallback, useRef } from 'react';

interface SoundConfig {
  volume?: number;
  playbackRate?: number;
}

export const useSound = () => {
  const audioContext = useRef<AudioContext | null>(null);
  const audioBuffers = useRef<Map<string, AudioBuffer>>(new Map());

  const initAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  }, []);

  const playSound = useCallback(async (soundType: string, config: SoundConfig = {}) => {
    try {
      const ctx = initAudioContext();
      
      // Генерируем синтетические звуки для разных событий
      const { volume = 0.3, playbackRate = 1 } = config;
      
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      // Настройки звуков для разных событий
      switch (soundType) {
        case 'case-opening':
          oscillator.frequency.setValueAtTime(400, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.5);
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.5);
          break;
          
        case 'roulette-spin':
          oscillator.frequency.setValueAtTime(200, ctx.currentTime);
          oscillator.frequency.linearRampToValueAtTime(600, ctx.currentTime + 2);
          gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 2);
          break;
          
        case 'item-reveal':
          oscillator.frequency.setValueAtTime(600, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.3);
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.3);
          break;
          
        case 'rare-item':
          // Многослойный звук для редких предметов
          for (let i = 0; i < 3; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(800 + (i * 200), ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(400 + (i * 100), ctx.currentTime + 0.8);
            gain.gain.setValueAtTime(volume * 0.7, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.8);
            osc.start(ctx.currentTime + (i * 0.1));
            osc.stop(ctx.currentTime + 0.8 + (i * 0.1));
          }
          return;
          
        case 'coins-earned':
          oscillator.frequency.setValueAtTime(800, ctx.currentTime);
          oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.2);
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
          break;
          
        case 'multiplier-win':
          // Восходящие звуки для множителя
          for (let i = 0; i < 5; i++) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.frequency.setValueAtTime(400 + (i * 150), ctx.currentTime + (i * 0.1));
            gain.gain.setValueAtTime(volume * 0.8, ctx.currentTime + (i * 0.1));
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3 + (i * 0.1));
            osc.start(ctx.currentTime + (i * 0.1));
            osc.stop(ctx.currentTime + 0.3 + (i * 0.1));
          }
          return;
          
        default:
          oscillator.frequency.setValueAtTime(440, ctx.currentTime);
          gainNode.gain.setValueAtTime(volume, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
          oscillator.start(ctx.currentTime);
          oscillator.stop(ctx.currentTime + 0.2);
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [initAudioContext]);

  const playCaseOpeningSound = useCallback(() => playSound('case-opening'), [playSound]);
  const playRouletteSpinSound = useCallback(() => playSound('roulette-spin'), [playSound]);
  const playItemRevealSound = useCallback(() => playSound('item-reveal'), [playSound]);
  const playRareItemSound = useCallback(() => playSound('rare-item'), [playSound]);
  const playCoinsEarnedSound = useCallback(() => playSound('coins-earned'), [playSound]);
  const playMultiplierWinSound = useCallback(() => playSound('multiplier-win'), [playSound]);

  return {
    playSound,
    playCaseOpeningSound,
    playRouletteSpinSound,
    playItemRevealSound,
    playRareItemSound,
    playCoinsEarnedSound,
    playMultiplierWinSound
  };
};

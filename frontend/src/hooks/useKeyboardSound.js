// audio setup
const keyStrokeSounds = [
  new Audio("/sounds/keystroke1.mp3"),
  new Audio("/sounds/keystroke2.mp3"),
  new Audio("/sounds/keystroke3.mp3"),
  new Audio("/sounds/keystroke4.mp3"),
];

function playMessageSound(notes) {
  if (typeof window === "undefined") return;

  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const context = new AudioContext();
    const startTime = context.currentTime;

    notes.forEach((note) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const noteStart = startTime + note.delay;

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(note.frequency, noteStart);
      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.12, noteStart + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(noteStart);
      oscillator.stop(noteStart + note.duration + 0.02);
    });

    const finalNote = notes.at(-1);
    window.setTimeout(() => context.close(), (finalNote.delay + finalNote.duration + 0.1) * 1000);
  } catch (error) {
    console.log("Audio play failed:", error);
  }
}

export function playMessageSentSound() {
  playMessageSound([{ frequency: 880, delay: 0, duration: 0.1 }]);
}

export function playMessageReceivedSound() {
  playMessageSound([
    { frequency: 660, delay: 0, duration: 0.1 },
    { frequency: 880, delay: 0.12, duration: 0.14 },
  ]);
}

function useKeyboardSound() {
  const playRandomKeyStrokeSound = () => {
    const randomSound = keyStrokeSounds[Math.floor(Math.random() * keyStrokeSounds.length)];

    randomSound.currentTime = 0; // this is for a better UX, def add this
    randomSound.play().catch((error) => console.log("Audio play failed:", error));
  };

  return { playRandomKeyStrokeSound };
}

export default useKeyboardSound;

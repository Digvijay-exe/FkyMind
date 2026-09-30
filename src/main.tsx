import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initMinecraftGlobalAudio } from './utils/audio';

// Initialize authentic Minecraft button click audio listeners
initMinecraftGlobalAudio();

createRoot(document.getElementById('root')!).render(<App />);

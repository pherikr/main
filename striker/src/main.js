import './style.css';
import { startGame } from './ui/controller.js';

const app = document.getElementById('app');

app.innerHTML = `
<div class="splash-screen animate__animated animate__fadeIn">
  <div class="splash-logo">STRIKER</div>
  <div class="splash-tagline">Football Career RPG — Academy Demo</div>
  <button class="splash-btn" id="splash-start">KICK OFF</button>
</div>
`;

document.getElementById('splash-start').addEventListener('click', () => {
  startGame();
});

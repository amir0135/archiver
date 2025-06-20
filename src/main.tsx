import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  // For testing, remove StrictMode (only in development)
  // <StrictMode>
    <App />
  // </StrictMode>
);

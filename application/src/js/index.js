import {pixelateSource} from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
    const query = location.search.substr(1);

    if (query && query.includes('settings=')) {
      query.split('&').forEach(part => {
        const item = part.split('=');
        if (item[0] === 'settings' && item[1]) {
            try {
                let settings = JSON.parse(decodeURIComponent(item[1]));
                console.log('Loaded settings from query string:', settings);
                pixelateSource(settings);
            } catch (err) {
                console.error('Failed to parse settings from query string', err);
            }
        }
      });
    } else {
        pixelateSource();
    }
});
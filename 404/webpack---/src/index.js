import '@/styles/main.scss';
import App from '@/components/App';

if (process.env.NODE_ENV !== 'development') {
    document.querySelector('.dg.ac').style.display = 'none';
}

App.init();
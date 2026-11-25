import { CommentsPlugin } from '@verbb/comments-vue';
import { createApp } from 'vue';

import App from './App.vue';
import { auth, endpoint } from './craft';
import './index.css';

createApp(App)
    // Every thread and composable in the app shares the endpoint and the sign-in.
    .use(CommentsPlugin, { endpoint, auth, theme: 'auto' })
    .mount('#app');

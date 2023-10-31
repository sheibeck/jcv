import './assets/main.css'

import { createApp, onBeforeUnmount, onMounted } from 'vue'
import App from './App.vue'

const app = createApp(App)

 // Custom directive definition
 const uppercaseDirective = {
    mounted(el: HTMLInputElement) {
        function handleInput() {
            el.value = el.value.toUpperCase();
        }

        el.addEventListener('input', handleInput);

        onMounted(() => {
            el.addEventListener('input', handleInput);
        });

        onBeforeUnmount(() => {
            el.removeEventListener('input', handleInput);
        });
    }
};

app.directive('uppercase', uppercaseDirective);

app.mount('#app')

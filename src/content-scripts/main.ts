import { createApp } from "vue";
import App from "./App.vue";
import { createPinia } from "pinia";

const openJcvEvent = new CustomEvent('openJcv');

window.onload = async () => {  
  const el = document.querySelector('body');
  if (el) {
    el.insertAdjacentHTML(
      'afterend',
      '<div id="jcvApp" class="hidden">Hello World</div>',
    );
    const app = createApp(App).use(createPinia());
    app.mount('#jcvApp');
  }
  
  const createButton = document.querySelector("nav");
  if (createButton) {
    createButton.insertAdjacentHTML(
      'afterend',
      `<div id="jcv-button">
        <button type="button" class="btn btn-primary">Versions</button>
      </div>`,
    );

    const jcvButton = document.getElementById("jcv-button");
    if (jcvButton) {
      jcvButton.addEventListener('click', () => {
        document.dispatchEvent(openJcvEvent);
      });
    }
  }
}

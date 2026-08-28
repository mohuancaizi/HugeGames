import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import "./styles.css";
import "./portal.css";

createApp(App).use(router).mount("#app");

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("/sw.js");
  });
}

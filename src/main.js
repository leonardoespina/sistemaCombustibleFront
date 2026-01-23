// FILE: main.js

import { createApp } from "vue";
import { Quasar, Notify, Dialog, Loading } from "quasar"; // Importa Notify, Dialog y Loading
import quasarLang from "quasar/lang/es";
import { createPinia } from "pinia";

// Importa el router que acabamos de crear
import router from "./router";

// Import icon libraries
import "@quasar/extras/material-icons/material-icons.css";
import "@quasar/extras/line-awesome/line-awesome.css";

// Import Quasar css
import "quasar/src/css/index.sass";

// Tu componente raíz
import App from "./App.vue";

const myApp = createApp(App);

// 1. Usa el Router
myApp.use(createPinia());
myApp.use(router);

// 2. Usa Quasar con sus plugins
myApp.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading, // Habilita el plugin Loading
  },
  lang: quasarLang,
});

// 3. Monta la aplicación
myApp.mount("#app");

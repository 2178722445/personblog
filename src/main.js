import { createApp } from "vue";
import {
  ElButton,
  ElDialog,
  ElOption,
  ElSelect,
  ElTooltip,
} from "element-plus";
// 按组件加载样式入口，自动带上遮罩、滚动条、弹出层等内部依赖。
import "element-plus/es/components/button/style/css";
import "element-plus/es/components/dialog/style/css";
import "element-plus/es/components/select/style/css";
import "element-plus/es/components/option/style/css";
import "element-plus/es/components/tooltip/style/css";
import "element-plus/es/components/message/style/css";
import "./styles/global.css";
import App from "./App.vue";
import router from "./router";

const app = createApp(App).use(router);
for (const component of [ElButton, ElDialog, ElOption, ElSelect, ElTooltip])
  app.use(component);
app.mount("#app");

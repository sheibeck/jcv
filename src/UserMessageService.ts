import { toast } from 'vue3-toastify';
import 'vue3-toastify/dist/index.css';

export const sendMessage = function (message: string) {
    toast( message, {
        autoClose: 2000,
        style: {
          zIndex: 999999,
        },
      })
  }
  
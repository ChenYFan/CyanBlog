import { Notyf } from 'notyf';
import 'notyf/notyf.min.css';
const notyf =new Notyf({
    duration: 3000,
    position: {
        x: 'right',
        y: 'bottom'
    },
    ripple: true,
    dismissible: true,
    types: [
        {
            type: 'warn',
            background: 'orange',
            icon: false
        },
        {
            type: 'info',
            background: 'blue',
            icon: false
        }
    ]
});
notyf.info = (message) => notyf.open({ type: 'info', message })
notyf.warn = (message) => notyf.open({ type: 'warn', message })
export default notyf 
import { useRef } from 'react';
import { useToastStore } from '../store/ui';
import { ToastType } from '../types';

const useToast = (): [(message: string, type: ToastType, timeout?: number) => void, () => void] => {
    const { setToast } = useToastStore();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timer = useRef<any>();

    const hideMessage = () => {
        setToast(null, null);
    }

    const showMessage = (message: string, type: ToastType, timeout: number = 5000) => {
        clearTimeout(timer.current);

        setToast(message, type);

        timer.current = setTimeout(() => {
            hideMessage();
        }, timeout);
    };

    return [showMessage, hideMessage]
}

export default useToast;
import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateFromWebSocket } from '../store/slices/procedureSlice';
import { API_URLS } from '../constants';

export const useWebSocket = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const ws = new WebSocket(API_URLS.websocket);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(updateFromWebSocket(data));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Cleanup function to properly close WebSocket
    const cleanup = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };

    // Add cleanup to window unload event
    window.addEventListener('beforeunload', cleanup);

    // Return cleanup function for useEffect
    return () => {
      window.removeEventListener('beforeunload', cleanup);
      cleanup();
    };
  }, [dispatch]);
}; 
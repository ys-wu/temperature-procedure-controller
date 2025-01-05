import { useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { updateFromWebSocket } from '../store/slices/procedureSlice';
import { WS_BASE_URL } from '../constants';

export const useWebSocket = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch(updateFromWebSocket(data));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };

    return () => {
      ws.close();
    };
  }, [dispatch]);
}; 
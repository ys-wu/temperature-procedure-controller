import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Statistic, Row, Col } from 'antd';
import { WS_URL } from '../constants';
import { setTemperatureSetpoint, setActualTemperature } from '../store/slices/temperatureSlice';
import { RootState } from '../store';

const TemperatureDisplay: React.FC = () => {
  const dispatch = useDispatch();
  const { setpoint, actualTemp } = useSelector((state: RootState) => state.temperature);

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;
    let timeoutMS = 1000;
    let isConnecting = false;

    const connectWebSocket = () => {
      if (isConnecting) return;

      isConnecting = true;
      console.log('Attempting to connect to WebSocket...');

      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log('WebSocket connection established');
          isConnecting = false;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.temperature_setpoint !== undefined) {
              dispatch(setTemperatureSetpoint(data.temperature_setpoint));
            }
            if (data.temperature_actual !== undefined) {
              dispatch(setActualTemperature(data.temperature_actual));
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          isConnecting = false;
        };

        ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          isConnecting = false;
          reconnectTimeout = setTimeout(connectWebSocket, timeoutMS);
        };
      } catch (error) {
        console.error('Error creating WebSocket connection:', error);
        isConnecting = false;
        reconnectTimeout = setTimeout(connectWebSocket, timeoutMS);
      }
    };

    connectWebSocket();

    return () => {
      console.log('Cleaning up WebSocket connection...');
      ws?.close();
      clearTimeout(reconnectTimeout);
    };
  }, [dispatch]);

  return (
    <Card>
      <Row gutter={16}>
        <Col span={12}>
          <Statistic
            title="Setpoint"
            value={setpoint !== null ? setpoint : '-'}
            suffix="°C"
            precision={1}
          />
        </Col>
        <Col span={12}>
          <Statistic
            title="Actual Temperature"
            value={actualTemp !== null ? actualTemp : '-'}
            suffix="°C"
            precision={1}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default TemperatureDisplay; 

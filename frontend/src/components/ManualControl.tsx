import React, { useState } from 'react';
import { InputNumber, Button, Space, message } from 'antd';
import { RootState } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setTemperature } from '../store/slices/temperatureSlice';

const ManualControl: React.FC = () => {
  const [inputTemp, setInputTemp] = useState<number>(25);
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state: RootState) => state.temperature);

  const handleSetTemperature = async () => {
    if (inputTemp !== null) {
      try {
        await dispatch(setTemperature(inputTemp)).unwrap();
        message.success(`Temperature set to ${inputTemp}°C`);
      } catch (err) {
        message.error('Failed to set temperature');
      }
    }
  };

  return (
    <Space>
      <InputNumber
        min={0}
        max={1000}
        value={inputTemp}
        onChange={(value) => setInputTemp(value || 0)}
        addonAfter="°C"
      />
      <Button
        type="primary"
        onClick={handleSetTemperature}
        loading={loading}
      >
        Set Temperature
      </Button>
    </Space>
  );
};

export default ManualControl;

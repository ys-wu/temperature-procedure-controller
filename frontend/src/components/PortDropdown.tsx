import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Dropdown, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { RootState, AppDispatch } from '../store';
import { fetchSerialPorts, selectSerialPort } from '../store/slices/serialPortSlice';

const initialPortPlaceholder = 'COM Port';

const PortDropdown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availablePorts, selectedPort, loading } = useSelector(
    (state: RootState) => state.serialPort
  );
  const [selectedItem, setSelectedItem] = useState<string>(initialPortPlaceholder);

  useEffect(() => {
    dispatch(fetchSerialPorts());
  }, [dispatch]);

  useEffect(() => {
    if (selectedPort) {
      setSelectedItem(selectedPort);
    }
  }, [selectedPort]);

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    const port = e.key.toString();
    setSelectedItem(port);
    dispatch(selectSerialPort(port));
  };

  const items: MenuProps['items'] = availablePorts.map((port) => ({
    label: port,
    key: port,
  }));

  return (
    <Dropdown
      menu={{
        items,
        onClick: handleMenuClick,
      }}
      disabled={loading}
    >
      <Button>
        <Space>
          {selectedItem}
          <DownOutlined />
        </Space>
      </Button>
    </Dropdown>
  );
};

export default PortDropdown;

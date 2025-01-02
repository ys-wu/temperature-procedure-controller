import React, { useState, useEffect } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, message, Space } from 'antd';
import axios from 'axios';
import { SELECT_SERIAL_PORT_URL, SERIAL_PORTS_URL } from '../constants';

const initialPortPlaceholder = 'COM Port';

const PortDropdown: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>(initialPortPlaceholder);

  useEffect(() => {
    fetchPorts();
  }, []);

  const fetchPorts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(SERIAL_PORTS_URL);
      setPorts(data.ports);
      setSelectedPort(initialPortPlaceholder);
    } catch (error) {
      message.error('Failed to fetch available ports');
      console.error('Error fetching ports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    try {
      await axios.post(SELECT_SERIAL_PORT_URL, { port: e.key });
      setSelectedPort(e.key as string);
      message.success(`Port ${e.key} selected successfully`);
    } catch (error) {
      message.error('Failed to select port');
      console.error('Error selecting port:', error);
    }
  };

  const items: MenuProps['items'] = ports.map((port) => ({
    label: port,
    key: port,
  }));

  const menuProps = {
    items,
    onClick: handleMenuClick,
  };

  return (
    <Space wrap>
      <Dropdown menu={menuProps}>
        <Button loading={loading}>
          <Space>
            {selectedPort}
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
      <Button onClick={fetchPorts} loading={loading}>
        Refresh Ports
      </Button>
    </Space>
  );
};

export default PortDropdown;

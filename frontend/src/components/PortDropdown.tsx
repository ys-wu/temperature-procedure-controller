import React, { useState, useEffect } from 'react';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { Button, Dropdown, message, Space } from 'antd';
import { SERIAL_PORTS_URL } from '../constants';


const handleMenuClick: MenuProps['onClick'] = (e) => {
  message.info('Click on menu item.');
  console.log('click', e);
};

const PortDropdown: React.FC = () => {
  const [ports, setPorts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPorts = async () => {
      setLoading(true);
      try {
        const response = await fetch(SERIAL_PORTS_URL);
        const data = await response.json();
        setPorts(data.ports);
      } catch (error) {
        message.error('Failed to fetch available ports');
        console.error('Error fetching ports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPorts();
  }, []);

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
            COM Port
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
    </Space>
  );
};

export default PortDropdown;

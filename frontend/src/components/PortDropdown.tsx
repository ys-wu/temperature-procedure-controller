import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Dropdown, message, Space } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { RootState, AppDispatch } from '../store';
import { fetchPorts, selectPort } from '../store/slices/serialPortSlice';

const initialPortPlaceholder = 'COM Port';

const PortDropdown: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { availablePorts, selectedPort, loading, error } = useSelector(
    (state: RootState) => state.serialPort
  );

  useEffect(() => {
    void dispatch(fetchPorts());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleMenuClick: MenuProps['onClick'] = async (e) => {
    try {
      await dispatch(selectPort(e.key as string)).unwrap();
      message.success(`Port ${e.key} selected successfully`);
    } catch (error) {
      // Error handling is done through the error state in the slice
    }
  };

  const items: MenuProps['items'] = availablePorts.map((port) => ({
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
            {selectedPort || initialPortPlaceholder}
            <DownOutlined />
          </Space>
        </Button>
      </Dropdown>
      <Button onClick={() => void dispatch(fetchPorts())} loading={loading}>
        Refresh Ports
      </Button>
    </Space>
  );
};

export default PortDropdown;

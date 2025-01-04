import React, { useEffect } from 'react';
import { Card, List, Typography, Tag, Spin, Row, Col } from 'antd';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProcedures, selectProcedure } from '../store/slices/procedureSlice';
import type { TemperatureProcedure as TProcedure } from '../store/slices/procedureSlice';

const { Title, Text } = Typography;

const TemperatureProcedure: React.FC = () => {
  const dispatch = useAppDispatch();
  const { procedures, selectedProcedure, loading, error } = useAppSelector(
    (state) => state.procedures
  );

  useEffect(() => {
    dispatch(fetchProcedures());
  }, [dispatch]);

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  const handleProcedureSelect = (procedure: TProcedure) => {
    dispatch(selectProcedure(procedure));
  };

  return (
    <Card title={<Title level={4}>Temperature Procedures</Title>}>
      <Row gutter={16}>
        <Col span={8}>
          <List
            bordered
            dataSource={procedures}
            renderItem={(procedure) => (
              <List.Item
                onClick={() => handleProcedureSelect(procedure)}
                style={{
                  cursor: 'pointer',
                  backgroundColor: selectedProcedure?.id === procedure.id ? '#f0f0f0' : 'transparent'
                }}
              >
                <Text strong={selectedProcedure?.id === procedure.id}>
                  {procedure.name}
                </Text>
              </List.Item>
            )}
          />
        </Col>
        <Col span={16}>
          {selectedProcedure ? (
            <Card title={selectedProcedure.name}>
              <List
                dataSource={selectedProcedure.steps}
                renderItem={(step, index) => (
                  <List.Item>
                    <Text strong>Step {index + 1}:</Text>
                    <Tag color="blue">{step.temperature}°C</Tag>
                    <Tag color="green">{step.duration} seconds</Tag>
                  </List.Item>
                )}
              />
            </Card>
          ) : (
            <Text>Select a procedure to view details</Text>
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default TemperatureProcedure;

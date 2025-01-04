import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Spin, Row, Col, Button, Form, Input, Space, Modal, InputNumber } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProcedures, selectProcedure, createProcedure, type TemperatureProcedure as TProcedure } from '../store/slices/procedureSlice';

const { Title, Text } = Typography;

interface ProcedureFormValues {
  name: string;
  steps: Array<{ temperature: number; duration: number }>;
}

const TemperatureProcedure: React.FC = () => {
  const dispatch = useAppDispatch();
  const { procedures, selectedProcedure, loading, error } = useAppSelector(
    (state) => state.procedures
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProcedures());
  }, [dispatch]);

  const handleProcedureSelect = (procedure: TProcedure) => {
    dispatch(selectProcedure(procedure));
  };

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCreate = async (values: ProcedureFormValues) => {
    await dispatch(createProcedure(values));
    setIsModalVisible(false);
    form.resetFields();
  };

  if (loading) {
    return <Spin size="large" />;
  }

  if (error) {
    return <Text type="danger">{error}</Text>;
  }

  return (
    <>
      <Card
        title={<Title level={4}>Temperature Procedures</Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={showModal}>New Procedure</Button>}
      >
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

      <Modal
        title="Create New Procedure"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleCreate}
          layout="vertical"
          initialValues={{ steps: [{}] }}
        >
          <Form.Item
            name="name"
            label="Procedure Name"
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input placeholder="Enter procedure name" />
          </Form.Item>

          <Form.List name="steps">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'temperature']}
                      label="Temperature (°C)"
                      rules={[{ required: true, message: 'Missing temperature' }]}
                    >
                      <InputNumber min={0} max={100} placeholder="Enter temperature" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, 'duration']}
                      label="Duration (seconds)"
                      rules={[{ required: true, message: 'Missing duration' }]}
                    >
                      <InputNumber min={1} placeholder="Enter duration" />
                    </Form.Item>
                    {fields.length > 1 && (
                      <MinusCircleOutlined onClick={() => remove(name)} />
                    )}
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Step
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Create Procedure
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TemperatureProcedure;

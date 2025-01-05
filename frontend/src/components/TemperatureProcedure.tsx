import React, { useEffect, useState } from 'react';
import { Card, List, Typography, Tag, Spin, Row, Col, Button, Form, Input, Space, Modal, InputNumber, Popconfirm } from 'antd';
import { PlusOutlined, MinusCircleOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProcedures, selectProcedure, createProcedure, deleteProcedure, updateProcedure, type TemperatureProcedure as TProcedure } from '../store/slices/procedureSlice';

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
  const [editingProcedure, setEditingProcedure] = useState<TProcedure | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    dispatch(fetchProcedures());
  }, [dispatch]);

  const handleProcedureSelect = (procedure: TProcedure) => {
    dispatch(selectProcedure(procedure));
  };

  const showModal = (procedure?: TProcedure) => {
    if (procedure) {
      setEditingProcedure(procedure);
      form.setFieldsValue(procedure);
    } else {
      setEditingProcedure(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setEditingProcedure(null);
    form.resetFields();
  };

  const handleSubmit = async (values: ProcedureFormValues) => {
    if (editingProcedure) {
      await dispatch(updateProcedure({ id: editingProcedure.id, procedure: values }));
    } else {
      await dispatch(createProcedure(values));
    }
    setIsModalVisible(false);
    setEditingProcedure(null);
    form.resetFields();
  };

  const handleDelete = async (procedureId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    await dispatch(deleteProcedure(procedureId));
  };

  const handleEdit = (e: React.MouseEvent, procedure: TProcedure) => {
    e.stopPropagation();
    showModal(procedure);
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
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>New Procedure</Button>}
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
                  actions={[
                    <Button
                      key="edit"
                      type="text"
                      icon={<EditOutlined />}
                      onClick={(e) => handleEdit(e, procedure)}
                    />,
                    <Popconfirm
                      key="delete"
                      title="Delete Procedure"
                      description="Are you sure you want to delete this procedure?"
                      onConfirm={() => handleDelete(procedure.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={e => e.stopPropagation()}
                      />
                    </Popconfirm>
                  ]}
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
        title={editingProcedure ? "Edit Procedure" : "Create New Procedure"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
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
              {editingProcedure ? 'Update' : 'Create'} Procedure
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default TemperatureProcedure;

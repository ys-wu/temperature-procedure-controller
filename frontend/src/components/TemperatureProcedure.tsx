import React, { useEffect, useState } from 'react';
import {
  Card,
  List,
  Typography,
  Tag,
  Spin,
  Row,
  Col,
  Button,
  Form,
  Input,
  Space,
  Modal,
  InputNumber,
  Popconfirm,
} from 'antd';
import {
  PlusOutlined,
  MinusCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  LoadingOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProcedures,
  selectProcedure,
  createProcedure,
  deleteProcedure,
  updateProcedure,
  startProcedure,
  stopProcedure,
  resetProcedure,
  type TemperatureProcedure as TProcedure,
  type CreateProcedurePayload,
} from '../store/slices/procedureSlice';
import { useWebSocket } from '../hooks/useWebSocket';

const { Title, Text } = Typography;

interface ProcedureFormValues {
  name: string;
  steps: Array<{ temperature: number; duration: number }>;
}

const transformFormValues = (values: ProcedureFormValues): CreateProcedurePayload => {
  return {
    name: values.name,
    steps: values.steps.map(step => ({
      ...step,
      status: 'queued' as const,
      elapsed_time: 0
    }))
  };
};

const getStepStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    case 'running':
      return <LoadingOutlined style={{ color: '#1890ff' }} />;
    case 'failed':
      return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
    default:
      return <ClockCircleOutlined style={{ color: '#d9d9d9' }} />;
  }
};

const getStepStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'success';
    case 'running':
      return 'processing';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

const TemperatureProcedure: React.FC = () => {
  const dispatch = useAppDispatch();
  const { procedures, selectedProcedure, loading, error } = useAppSelector(
    (state) => state.procedures
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCompletionModalVisible, setIsCompletionModalVisible] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState<TProcedure | null>(null);
  const [form] = Form.useForm();

  useWebSocket();

  useEffect(() => {
    dispatch(fetchProcedures());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProcedure?.status === 'completed') {
      setIsCompletionModalVisible(true);
    }
  }, [selectedProcedure?.status]);

  const handleProcedureSelect = (procedure: TProcedure) => {
    dispatch(selectProcedure(procedure));
  };

  const handleCompletionConfirm = async () => {
    if (selectedProcedure) {
      try {
        await dispatch(resetProcedure(selectedProcedure.id)).unwrap();
        setIsCompletionModalVisible(false);
      } catch (error) {
        console.error('Error resetting procedure:', error);
      }
    }
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
    const transformedValues = transformFormValues(values);
    if (editingProcedure) {
      await dispatch(updateProcedure({ id: editingProcedure.id, procedure: transformedValues }));
    } else {
      await dispatch(createProcedure(transformedValues));
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

  const handleStartProcedure = async (procedureId: string) => {
    try {
      await dispatch(startProcedure(procedureId)).unwrap();
    } catch (error) {
      console.error('Error starting procedure:', error);
    }
  };

  const handleStopProcedure = async () => {
    try {
      await dispatch(stopProcedure()).unwrap();
    } catch (error) {
      console.error('Error stopping procedure:', error);
    }
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
              <Card
                title={selectedProcedure.name}
                extra={
                  <>
                    {selectedProcedure.status === 'running' ? (
                      <Button
                        type="primary"
                        danger
                        icon={<StopOutlined />}
                        onClick={handleStopProcedure}
                      >
                        Stop
                      </Button>
                    ) : (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={() => handleStartProcedure(selectedProcedure.id)}
                      >
                        Start
                      </Button>
                    )}
                  </>
                }
              >
                <List
                  dataSource={selectedProcedure.steps}
                  renderItem={(step, index) => (
                    <List.Item>
                      <Space>
                        {getStepStatusIcon(step.status)}
                        <Text strong>Step {index + 1}:</Text>
                        <Tag color="blue">{step.temperature}°C</Tag>
                        <Tag color="green">{step.duration} seconds</Tag>
                        {step.status === 'running' && (
                          <Tag color={getStepStatusColor(step.status)}>
                            {step.elapsed_time}s / {step.duration}s
                          </Tag>
                        )}
                        <Tag color={getStepStatusColor(step.status)}>
                          {step.status}
                        </Tag>
                      </Space>
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

      <Modal
        title="Procedure Completed"
        open={isCompletionModalVisible}
        onCancel={() => setIsCompletionModalVisible(false)}
        footer={[
          <Button key="confirm" type="primary" onClick={handleCompletionConfirm}>
            Confirm
          </Button>,
        ]}
      >
        <p>Procedure completed.</p>
      </Modal>
    </>
  );
};

export default TemperatureProcedure;

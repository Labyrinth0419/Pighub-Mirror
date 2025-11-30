import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Tabs, Tag, Modal, Upload, Input, Form } from 'antd';
import { UploadOutlined, EditOutlined } from '@ant-design/icons';
import { getLogs, triggerCrawl, type CrawlLog, getImages, type Image, deleteImage, uploadImage, renameImage } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Admin: React.FC = () => {
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [renameModalVisible, setRenameModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [form] = Form.useForm();
  const [renameForm] = Form.useForm();
  const navigate = useNavigate();

  const fetchLogs = async () => {
    try {
      const data = await getLogs();
      setLogs(data);
    } catch (error) {
      message.error('Failed to fetch logs');
    }
  };

  const fetchImages = async () => {
      try {
          const data = await getImages(1, 100); // Fetch first 100 for admin view
          setImages(data.data);
      } catch (error) {
          message.error('Failed to fetch images');
      }
  }

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchLogs();
    fetchImages();
  }, [navigate]);

  const handleCrawl = async () => {
    setLoading(true);
    try {
      await triggerCrawl();
      message.success('Crawl started in background');
      // Refresh logs after a short delay
      setTimeout(fetchLogs, 2000);
    } catch (error) {
      message.error('Failed to start crawl');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
      try {
          await deleteImage(id);
          message.success('Image deleted');
          fetchImages();
      } catch (error) {
          message.error('Failed to delete image');
      }
  }

  const handleUpload = async (values: any) => {
    try {
      const { file, title } = values;
      await uploadImage(file.file.originFileObj, title);
      message.success('Image uploaded successfully');
      setUploadModalVisible(false);
      form.resetFields();
      fetchImages();
    } catch (error) {
      message.error('Upload failed');
    }
  };

  const handleRename = async (values: any) => {
    if (!selectedImage) return;
    try {
      await renameImage(selectedImage.id, values.title);
      message.success('Image renamed successfully');
      setRenameModalVisible(false);
      renameForm.resetFields();
      fetchImages();
    } catch (error) {
      message.error('Rename failed');
    }
  };

  const showRenameModal = (image: Image) => {
    setSelectedImage(image);
    renameForm.setFieldsValue({ title: image.title });
    setRenameModalVisible(true);
  };

  const logColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
        <Tag color={status === 'success' ? 'green' : status === 'running' ? 'blue' : 'red'}>{status}</Tag>
    ) },
    { title: 'Found', dataIndex: 'images_found', key: 'images_found' },
    { title: 'Downloaded', dataIndex: 'images_downloaded', key: 'images_downloaded' },
    { title: 'Error', dataIndex: 'error_message', key: 'error_message' },
    { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() },
  ];

  const imageColumns = [
      { title: 'ID', dataIndex: 'id', key: 'id' },
      { title: 'Title', dataIndex: 'title', key: 'title' },
      { title: 'Filename', dataIndex: 'filename', key: 'filename' },
      { title: 'Actions', key: 'action', render: (_: any, record: Image) => (
          <>
            <Button icon={<EditOutlined />} size="small" onClick={() => showRenameModal(record)} style={{ marginRight: 8 }}>
              Rename
            </Button>
            <Button danger size="small" onClick={() => handleDelete(record.id)}>Delete</Button>
          </>
      )}
  ]

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Admin Dashboard</Title>
        <div>
          <Button type="default" icon={<UploadOutlined />} onClick={() => setUploadModalVisible(true)} style={{ marginRight: 8 }}>
            Upload Image
          </Button>
          <Button type="primary" onClick={handleCrawl} loading={loading}>
            Trigger Crawl
          </Button>
        </div>
      </div>

      <Tabs defaultActiveKey="1" items={[
          {
              key: '1',
              label: 'Crawl Logs',
              children: <Table dataSource={logs} columns={logColumns} rowKey="id" />
          },
          {
              key: '2',
              label: 'Manage Images',
              children: <Table dataSource={images} columns={imageColumns} rowKey="id" />
          }
      ]} />

      <Modal
        title="Upload Image"
        open={uploadModalVisible}
        onCancel={() => setUploadModalVisible(false)}
        footer={null}
      >
        <Form form={form} onFinish={handleUpload}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please input title' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="file" label="Image" rules={[{ required: true, message: 'Please select an image' }]}>
            <Upload beforeUpload={() => false} maxCount={1}>
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Upload
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Rename Image"
        open={renameModalVisible}
        onCancel={() => setRenameModalVisible(false)}
        footer={null}
      >
        <Form form={renameForm} onFinish={handleRename}>
          <Form.Item name="title" label="New Title" rules={[{ required: true, message: 'Please input new title' }]}>
            <Input />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Rename
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Admin;

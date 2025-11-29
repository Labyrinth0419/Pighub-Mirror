import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Tabs, Tag } from 'antd';
import { getLogs, triggerCrawl, type CrawlLog, getImages, type Image, deleteImage } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

const Admin: React.FC = () => {
    const [logs, setLogs] = useState<CrawlLog[]>([]);
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(false);
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

    const logColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        {
            title: 'Status', dataIndex: 'status', key: 'status', render: (status: string) => (
                <Tag color={status === 'success' ? 'green' : status === 'running' ? 'blue' : 'red'}>{status}</Tag>
            )
        },
        { title: 'Found', dataIndex: 'images_found', key: 'images_found' },
        { title: 'Downloaded', dataIndex: 'images_downloaded', key: 'images_downloaded' },
        { title: 'Error', dataIndex: 'error_message', key: 'error_message' },
        { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: (text: string) => new Date(text).toLocaleString() },
    ];

    const imageColumns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'Filename', dataIndex: 'filename', key: 'filename' },
        {
            title: 'Actions', key: 'action', render: (_: any, record: Image) => (
                <Button danger size="small" onClick={() => handleDelete(record.id)}>Delete</Button>
            )
        }
    ]

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <Title level={2}>Admin Dashboard</Title>
                <Button type="primary" onClick={handleCrawl} loading={loading}>
                    Trigger Crawl
                </Button>
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
        </div>
    );
};

export default Admin;

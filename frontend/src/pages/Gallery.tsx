import React, { useEffect, useState } from 'react';
import { Card, List, Pagination, Spin, Typography, Input, Button, message, Space } from 'antd';
import { DownloadOutlined, FileImageOutlined } from '@ant-design/icons';
import { getImages, getImageUrl, searchImages, type Image } from '../services/api';

const { Title } = Typography;
const { Search } = Input;

const Gallery: React.FC = () => {
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const pageSize = 20;

    const fetchData = async (p: number) => {
        setLoading(true);
        try {
            const data = await getImages(p, pageSize);
            setImages(data.data);
            setTotal(data.total);
        } catch (error) {
            console.error('Failed to fetch images', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (value: string) => {
        if (!value.trim()) {
            setSearchQuery('');
            fetchData(1);
            return;
        }

        setLoading(true);
        setSearchQuery(value);
        try {
            const results = await searchImages(value);
            setImages(results);
            setTotal(results.length);
            setPage(1);
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCardClick = async (item: Image) => {
        try {
            const url = getImageUrl(item.local_path);
            const response = await fetch(url);
            const blob = await response.blob();

            // Convert to PNG for better clipboard compatibility
            const img = new window.Image();
            img.src = URL.createObjectURL(blob);

            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0);

            canvas.toBlob(async (pngBlob) => {
                if (!pngBlob) {
                    message.error('转换失败');
                    return;
                }

                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({
                            'image/png': pngBlob
                        })
                    ]);
                    message.success('图片已复制到剪贴板');
                } catch (err) {
                    console.error('Clipboard write failed:', err);
                    message.error('复制失败，请使用下载按钮');
                }
            }, 'image/png');

            URL.revokeObjectURL(img.src);
        } catch (error) {
            console.error('Copy failed:', error);
            message.error('复制失败，请使用下载按钮');
        }
    };

    const handleCopyBase64 = async (item: Image, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const url = getImageUrl(item.local_path);
            const response = await fetch(url);
            const blob = await response.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                const html = `<img src="${base64}" alt="${item.title}" />`;
                navigator.clipboard.writeText(html);
                message.success('HTML (Base64) 已复制到剪贴板');
            };
            reader.readAsDataURL(blob);
        } catch (error) {
            message.error('复制失败');
        }
    };

    const handleDownload = (item: Image, e: React.MouseEvent) => {
        e.stopPropagation();
        const url = getImageUrl(item.local_path);
        const link = document.createElement('a');
        link.href = url;
        link.download = item.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success('开始下载');
    };

    useEffect(() => {
        if (!searchQuery) {
            fetchData(page);
        }
    }, [page]);

    return (
        <div style={{ padding: '24px', backgroundColor: '#ffffff', minHeight: '100vh' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
                Pighub Mirror Gallery
            </Title>

            <div style={{ maxWidth: '600px', margin: '0 auto 32px' }}>
                <Search
                    placeholder="搜索图片标题..."
                    allowClear
                    enterButton="搜索"
                    size="large"
                    onSearch={handleSearch}
                />
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '50px' }}>
                    <Spin size="large" />
                </div>
            ) : (
                <>
                    <List
                        grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 6 }}
                        dataSource={images}
                        renderItem={(item) => (
                            <List.Item>
                                <Card
                                    hoverable
                                    onClick={() => handleCardClick(item)}
                                    cover={
                                        <div style={{ height: 200, overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
                                            <img
                                                alt={item.title}
                                                src={getImageUrl(item.local_path)}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    }
                                    style={{ backgroundColor: '#fff', border: '1px solid #e8e8e8' }}
                                >
                                    <Card.Meta
                                        title={<span style={{ color: '#333' }}>{item.title}</span>}
                                        description={
                                            <div style={{ fontSize: '12px', color: '#666' }}>
                                                <div>浏览: {item.view_count}</div>
                                                <div>{new Date(item.mtime * 1000).toLocaleDateString()}</div>
                                            </div>
                                        }
                                    />
                                    <Space style={{ marginTop: '12px', width: '100%' }} direction="vertical" size="small">
                                        <Button
                                            icon={<FileImageOutlined />}
                                            size="small"
                                            block
                                            onClick={(e) => handleCopyBase64(item, e)}
                                        >
                                            复制 HTML (Base64)
                                        </Button>
                                        <Button
                                            icon={<DownloadOutlined />}
                                            size="small"
                                            block
                                            type="primary"
                                            onClick={(e) => handleDownload(item, e)}
                                        >
                                            下载图片
                                        </Button>
                                    </Space>
                                </Card>
                            </List.Item>
                        )}
                    />
                    {!searchQuery && (
                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <Pagination
                                current={page}
                                total={total}
                                pageSize={pageSize}
                                onChange={(p) => setPage(p)}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Gallery;

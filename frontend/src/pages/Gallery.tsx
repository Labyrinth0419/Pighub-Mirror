import React, { useEffect, useState } from 'react';
import { Card, List, Pagination, Spin, Typography } from 'antd';
import { getImages, getImageUrl, type Image } from '../services/api';

const { Title } = Typography;

const Gallery: React.FC = () => {
    const [images, setImages] = useState<Image[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
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

    useEffect(() => {
        fetchData(page);
    }, [page]);

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2} style={{ textAlign: 'center', marginBottom: '32px' }}>
                Image Mirror Gallery
            </Title>

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
                                    cover={
                                        <div style={{ height: 200, overflow: 'hidden' }}>
                                            <img
                                                alt={item.title}
                                                src={getImageUrl(item.local_path)}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                    }
                                >
                                    <Card.Meta
                                        title={item.title}
                                        description={
                                            <div style={{ fontSize: '12px' }}>
                                                <div>Views: {item.view_count}</div>
                                                <div>{new Date(item.mtime * 1000).toLocaleDateString()}</div>
                                            </div>
                                        }
                                    />
                                </Card>
                            </List.Item>
                        )}
                    />
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Pagination
                            current={page}
                            total={total}
                            pageSize={pageSize}
                            onChange={(p) => setPage(p)}
                            showSizeChanger={false}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default Gallery;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import Gallery from './pages/Gallery';
import Admin from './pages/Admin';
import Login from './pages/Login';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
    return (
        <Router>
            <Layout className="layout" style={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
                <Header style={{ backgroundColor: '#fff', borderBottom: '1px solid #e8e8e8' }}>
                    <div className="logo" style={{ float: 'left', color: '#333', fontSize: '20px', fontWeight: 'bold', marginRight: '30px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src="/pig.svg" alt="Pighub" style={{ height: '32px', width: '32px' }} />
                        <span>Pighub Mirror</span>
                    </div>
                    <Menu theme="light" mode="horizontal" defaultSelectedKeys={['1']}>
                        <Menu.Item key="1"><Link to="/">Gallery</Link></Menu.Item>
                        <Menu.Item key="2"><Link to="/admin">Admin</Link></Menu.Item>
                    </Menu>
                </Header>
                <Content style={{ padding: '0', backgroundColor: '#ffffff' }}>
                    <div className="site-layout-content" style={{ margin: '0' }}>
                        <Routes>
                            <Route path="/" element={<Gallery />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/admin" element={<Admin />} />
                        </Routes>
                    </div>
                </Content>
                <Footer style={{ textAlign: 'center', backgroundColor: '#fff', borderTop: '1px solid #e8e8e8' }}>Pighub Mirror ©2024</Footer>
            </Layout>
        </Router>
    );
};

export default App;

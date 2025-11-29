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
      <Layout className="layout" style={{ minHeight: '100vh' }}>
        <Header>
          <div className="logo" style={{ float: 'left', color: 'white', fontSize: '20px', fontWeight: 'bold', marginRight: '30px' }}>
            Image Mirror
          </div>
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
            <Menu.Item key="1"><Link to="/">Gallery</Link></Menu.Item>
            <Menu.Item key="2"><Link to="/admin">Admin</Link></Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content" style={{ margin: '16px 0' }}>
            <Routes>
              <Route path="/" element={<Gallery />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Image Mirror ©2024</Footer>
      </Layout>
    </Router>
  );
};

export default App;

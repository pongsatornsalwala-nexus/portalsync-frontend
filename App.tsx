
import React, { useState } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import EmployeePage from './components/EmployeePage';
import PortalSync from './components/PortalSync';
import SummaryReport from './components/SummaryReport';
import WorksiteConfig from './components/WorksiteConfig';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'employee':
        return <EmployeePage />;
      case 'portalSync':
        return <PortalSync />;
      case 'summary':
        return <SummaryReport />;
      case 'worksite':
        return <WorksiteConfig />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default App;

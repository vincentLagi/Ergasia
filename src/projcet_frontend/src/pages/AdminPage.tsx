import React from 'react';
import { Typography, Card, Divider } from 'antd';

const { Title, Paragraph } = Typography;

const AdminPage = () => {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-5xl mx-auto shadow-md">
        <Title level={2} className="text-center mb-6">Admin Tools</Title>
        
        <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
          This page contains administrative tools for managing the application. Use these tools with caution 
          as they can affect the data in the system.
        </Paragraph>
        
        <Divider orientation="left">Dummy Data Generator</Divider>
        
        <Paragraph className="text-gray-600 dark:text-gray-400 mb-4">
          The tool below allows you to generate test data for development and testing purposes.
          You can specify the number of items to create for each data type.
        </Paragraph>
        
      </Card>
    </div>
  );
};

export default AdminPage;

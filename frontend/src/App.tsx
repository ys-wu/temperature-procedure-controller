import React from 'react';
import { Tabs, Typography } from 'antd';
// import PortDropdown from './components/PortDropdown';
import TemperatureDisplay from './components/TemperatureDisplay';
import TemperatureProcedure from './components/TemperatureProcedure';
import ManualControl from './components/ManualControl';
import { usePreventExit } from './hooks/usePreventExit';

const { Text } = Typography;

function App() {
  usePreventExit();

  return (
    <div style={{ margin: '24px', maxWidth: '1200px', marginLeft: 'auto', marginRight: 'auto' }}>
      <h1 style={{ marginBottom: '24px' }}>Temperature Procedure Controller</h1>
      {/* <div style={{ marginBottom: '24px' }}>
        <PortDropdown />
      </div> */}
      <div style={{ marginBottom: '24px' }}>
        <TemperatureDisplay />
      </div>
      <div style={{ marginBottom: '24px' }}>
        <Tabs
          defaultActiveKey="procedure"
          items={[
            {
              key: 'procedure',
              label: 'Procedure',
              children: <TemperatureProcedure />,
            },
            {
              key: 'manual',
              label: 'Manual',
              children: <ManualControl />,
            },
          ]}
        />
      </div>
      <footer style={{ textAlign: 'center', marginTop: '48px', marginBottom: '24px' }}>
        <Text type="secondary">
          For bugs and issues, please contact: <a href="mailto:yusheng.wu@helsinki.fi">yusheng.wu@helsinki.fi</a>
        </Text>
      </footer>
    </div>
  );
}

export default App;

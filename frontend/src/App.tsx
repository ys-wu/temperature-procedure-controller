import React from 'react';
import { Tabs } from 'antd';
import PortDropdown from './components/PortDropdown';
import TemperatureProcedure from './components/TemperatureProcedure';

function App() {
  return (
    <div>
      <h1>Temperature Procedure Controller</h1>
      <PortDropdown />
      <Tabs
        defaultActiveKey="manual"
        items={[
          {
            key: 'manual',
            label: 'Manual',
            children: <div>Manual Control</div>,
          },
          {
            key: 'procedure',
            label: 'Procedure',
            children: <TemperatureProcedure />,
          },
        ]}
      />
    </div>
  );
}

export default App;

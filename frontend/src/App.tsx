import React from 'react';
import { Tabs } from 'antd';
import PortDropdown from './components/PortDropdown';
import TemperatureDisplay from './components/TemperatureDisplay';
import ManualControl from './components/ManualControl';
import TemperatureProcedure from './components/TemperatureProcedure';

function App() {
  return (
    <div>
      <h1>Temperature Procedure Controller</h1>
      <PortDropdown />
      <TemperatureDisplay />
      <Tabs
        defaultActiveKey="manual"
        items={[
          {
            key: 'manual',
            label: 'Manual',
            children: <ManualControl />,
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

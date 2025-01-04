import React from 'react';
import { Tabs } from 'antd';
import PortDropdown from './components/PortDropdown';
import TemperatureDisplay from './components/TemperatureDisplay';
import TemperatureProcedure from './components/TemperatureProcedure';
import ManualControl from './components/ManualControl';

function App() {
  return (
    <div>
      <h1>Temperature Procedure Controller</h1>
      <PortDropdown />
      <TemperatureDisplay />
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
  );
}

export default App;

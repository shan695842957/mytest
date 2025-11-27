import React, { useState } from 'react';
import EnergyFlowPanel, {
  FlowDirection,
} from '../components/energy-flow/EnergyFlowPanel';

export const EnergyFlowDemo = () => {
  const [direction, setDirection] = useState<FlowDirection>('charge');

  return (
    <div className="space-y-6 rounded-3xl border border-slate-700/50 bg-slate-900/40 p-6 text-white">
      <div className="flex gap-4">
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            direction === 'charge'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800/60 text-slate-300'
          }`}
          onClick={() => setDirection('charge')}
        >
          充电
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
            direction === 'discharge'
              ? 'bg-sky-500 text-white'
              : 'bg-slate-800/60 text-slate-300'
          }`}
          onClick={() => setDirection('discharge')}
        >
          放电
        </button>
      </div>

      <EnergyFlowPanel
        direction={direction}
        gridSide={{
          title: 'Grid',
          subtitle: 'AC · 10 kV',
          metrics: [
            { label: 'AC Power', value: 69.2, unit: 'kW' },
            { label: 'Voltage', value: 380, unit: 'V' },
          ],
        }}
        pcs={{
          title: 'PCS',
          status: direction === 'charge' ? 'Rectifying' : 'Inverting',
          efficiency: 98.2,
          metrics: [
            { label: 'Conversion Loss', value: 1.2, unit: 'kW' },
            {
              label: 'Heat Load',
              value: direction === 'charge' ? 32 : 37,
              unit: '°C',
            },
          ],
        }}
        batterySide={{
          title: 'Battery Array',
          subtitle: 'DC Bus · 1500 V',
          metrics: [
            { label: 'DC Power', value: 67.9, unit: 'kW' },
            { label: 'SOC', value: '59', unit: '%' },
          ],
        }}
      />
    </div>
  );
};

export default EnergyFlowDemo;

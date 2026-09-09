import React from 'react';
import SwarmController from './SwarmController';
import TelemetryOverlay from './TelemetryOverlay';

const Dashboard: React.FC = () => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6 flex flex-col justify-between">
      {/* Top Section */}
      <div className="flex justify-between items-start w-full">
        <SwarmController />
        <TelemetryOverlay />
      </div>

      {/* Bottom Section (For Timeline Scrubber later) */}
      <div className="flex justify-center items-end w-full pb-4">
        {/* Timeline Scrubber will go here */}
      </div>
    </div>
  );
};

export default Dashboard;

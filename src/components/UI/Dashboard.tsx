import React from 'react';
import SwarmController from './SwarmController';
import TelemetryOverlay from './TelemetryOverlay';
import MissionTimeline from './MissionTimeline';
import WaypointMissionPanel from './WaypointMissionPanel';
import ImageFormationPanel from './ImageFormationPanel';
import ScenarioPanel from './ScenarioPanel';

const Dashboard: React.FC = () => {
  return (
    <div className="absolute inset-0 z-10 pointer-events-none p-6">
      {/* Top Section */}
      <div className="flex justify-between items-start gap-6 w-full">
        <div className="flex max-h-[calc(100vh-10rem)] flex-col gap-4 overflow-y-auto pr-1">
          <SwarmController />
          <WaypointMissionPanel />
          <ImageFormationPanel />
          <ScenarioPanel />
        </div>
        <TelemetryOverlay />
      </div>

      {/* Mission progress and route overview */}
      <div className="absolute bottom-4 left-6 right-6 flex justify-center">
        <MissionTimeline />
      </div>
    </div>
  );
};

export default Dashboard;

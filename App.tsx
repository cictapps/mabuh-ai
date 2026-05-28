import { useState } from "react";
import AirportPage from "./component/Airport";
import Airborne from "./component/Airborne";
import { FlightCheckpoint } from "./component/flightSchedule";

type AirportParams = {
  phase?: "preflight" | "airborne" | "checkpoints" | "landingFinal";
  openEmergency?: boolean;
};

export default function App() {
  const [screen, setScreen] = useState<"airport" | "airborne">("airport");
  const [airportParams, setAirportParams] = useState<AirportParams>({});
  const [checkpoints, setCheckpoints] = useState<FlightCheckpoint[]>([
    { id: "start", label: "Start of day", time: "08:00 AM" },
    { id: "midmorning", label: "Next checkpoint", time: "10:30 AM" },
    { id: "afternoon", label: "Afternoon checkpoint", time: "02:00 PM" },
  ]);

  const addCheckpoint = (checkpoint: FlightCheckpoint) => {
    setCheckpoints((current) => [checkpoint, ...current]);
  };

  const removeCheckpoint = (checkpointId: string) => {
    setCheckpoints((current) => current.filter((checkpoint) => checkpoint.id !== checkpointId));
  };

  const openAirport = (params: AirportParams = {}) => {
    setAirportParams(params);
    setScreen("airport");
  };

  if (screen === "airborne") {
    return (
      <Airborne
        checkpoints={checkpoints}
        onOpenCheckpoints={() => openAirport({ phase: "checkpoints" })}
        onOpenLandingFinal={() => openAirport({ phase: "landingFinal" })}
        onOpenEmergency={() => openAirport({ openEmergency: true })}
      />
    );
  }

  return (
    <AirportPage
      checkpoints={checkpoints}
      onAddCheckpoint={addCheckpoint}
      onRemoveCheckpoint={removeCheckpoint}
      incomingPhase={airportParams.phase}
      incomingOpenEmergency={airportParams.openEmergency}
      onTakeoff={() => openAirport({ phase: "airborne" })}
    />
  );
}

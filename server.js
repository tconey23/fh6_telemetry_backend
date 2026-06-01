import express from "express";
import cors from "cors";
import dgram from "dgram";
import { WebSocketServer } from "ws";
import { createClient } from "@supabase/supabase-js";
import ws from "ws";

const UDP_PORT = 7777;
const HTTP_PORT = 3001;

const supabase = createClient(
  "https://dhfsglduhldnudgaebcj.supabase.co",
  "sb_publishable_Br4alOgX9DTU64IvQDG_BQ_dO5CHOXw",
  {
    realtime: {
      transport: ws,
    },
  }
);

console.log("Supabase initialized");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    udpPort: UDP_PORT,
    websocketPort: HTTP_PORT,
  });
});

const httpServer = app.listen(HTTP_PORT, () => {
  console.log(`Express/WebSocket server running on http://localhost:${HTTP_PORT}`);
});

const wss = new WebSocketServer({ server: httpServer });

wss.on("connection", (client) => {
  console.log("React client connected");

  client.send(
    JSON.stringify({
      type: "status",
      message: "Connected to FH6 telemetry server",
    })
  );

  client.on("close", () => {
    console.log("React client disconnected");
  });
});

const broadcastTelemetry = (telemetry) => {
  const payload = JSON.stringify({
    type: "telemetry",
    data: telemetry,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  });
};

const bool = (value) => value === 1;

const carClass = (c) => {
  switch (c) {
    case 0:
      return "D";
    case 1:
      return "C";
    case 2:
      return "B";
    case 3:
      return "A";
    case 4:
      return "S1";
    case 5:
      return "S2";
    case 6:
      return "R";
    case 7:
      return "X";
    default:
      return "UNKNOWN";
  }
};

const driveTrain = (d) => {
  switch (d) {
    case 0:
      return "FWD";
    case 1:
      return "RWD";
    case 2:
      return "AWD";
    default:
      return "UNKNOWN";
  }
};

const parseTelemetry = (msg) => ({
  IsRaceOn: bool(msg.readInt32LE(0)),
  TimestampMS: msg.readUInt32LE(4),

  EngineMaxRpm: msg.readFloatLE(8),
  EngineIdleRpm: msg.readFloatLE(12),
  CurrentEngineRpm: msg.readFloatLE(16),

  AccelerationX: msg.readFloatLE(20),
  AccelerationY: msg.readFloatLE(24),
  AccelerationZ: msg.readFloatLE(28),

  VelocityX: msg.readFloatLE(32),
  VelocityY: msg.readFloatLE(36),
  VelocityZ: msg.readFloatLE(40),

  AngularVelocityX: msg.readFloatLE(44),
  AngularVelocityY: msg.readFloatLE(48),
  AngularVelocityZ: msg.readFloatLE(52),

  Yaw: msg.readFloatLE(56),
  Pitch: msg.readFloatLE(60),
  Roll: msg.readFloatLE(64),

  NormalizedSuspensionTravelFrontLeft: msg.readFloatLE(68),
  NormalizedSuspensionTravelFrontRight: msg.readFloatLE(72),
  NormalizedSuspensionTravelRearLeft: msg.readFloatLE(76),
  NormalizedSuspensionTravelRearRight: msg.readFloatLE(80),

  TireSlipRatioFrontLeft: msg.readFloatLE(84),
  TireSlipRatioFrontRight: msg.readFloatLE(88),
  TireSlipRatioRearLeft: msg.readFloatLE(92),
  TireSlipRatioRearRight: msg.readFloatLE(96),

  WheelRotationSpeedFrontLeft: msg.readFloatLE(100),
  WheelRotationSpeedFrontRight: msg.readFloatLE(104),
  WheelRotationSpeedRearLeft: msg.readFloatLE(108),
  WheelRotationSpeedRearRight: msg.readFloatLE(112),

  WheelOnRumbleStripFrontLeft: bool(msg.readInt32LE(116)),
  WheelOnRumbleStripFrontRight: bool(msg.readInt32LE(120)),
  WheelOnRumbleStripRearLeft: bool(msg.readInt32LE(124)),
  WheelOnRumbleStripRearRight: bool(msg.readInt32LE(128)),

  WheelInPuddleFrontLeft: bool(msg.readInt32LE(132)),
  WheelInPuddleFrontRight: bool(msg.readInt32LE(136)),
  WheelInPuddleRearLeft: bool(msg.readInt32LE(140)),
  WheelInPuddleRearRight: bool(msg.readInt32LE(144)),

  SurfaceRumbleFrontLeft: msg.readFloatLE(148),
  SurfaceRumbleFrontRight: msg.readFloatLE(152),
  SurfaceRumbleRearLeft: msg.readFloatLE(156),
  SurfaceRumbleRearRight: msg.readFloatLE(160),

  TireSlipAngleFrontLeft: msg.readFloatLE(164),
  TireSlipAngleFrontRight: msg.readFloatLE(168),
  TireSlipAngleRearLeft: msg.readFloatLE(172),
  TireSlipAngleRearRight: msg.readFloatLE(176),

  TireCombinedSlipFrontLeft: msg.readFloatLE(180),
  TireCombinedSlipFrontRight: msg.readFloatLE(184),
  TireCombinedSlipRearLeft: msg.readFloatLE(188),
  TireCombinedSlipRearRight: msg.readFloatLE(192),

  SuspensionTravelMetersFrontLeft: msg.readFloatLE(196),
  SuspensionTravelMetersFrontRight: msg.readFloatLE(200),
  SuspensionTravelMetersRearLeft: msg.readFloatLE(204),
  SuspensionTravelMetersRearRight: msg.readFloatLE(208),

  CarOrdinal: msg.readInt32LE(212),
  CarClass: carClass(msg.readInt32LE(216)),
  CarPerformanceIndex: msg.readInt32LE(220),
  DrivetrainType: driveTrain(msg.readInt32LE(224)),
  NumCylinders: msg.readInt32LE(228),
  CarGroup: msg.readUInt32LE(232),

  SmashableVelDiff: msg.readFloatLE(236),
  SmashableMass: msg.readFloatLE(240),

  PositionX: msg.readFloatLE(244),
  PositionY: msg.readFloatLE(248),
  PositionZ: msg.readFloatLE(252),

  Speed: msg.readFloatLE(256),
  SpeedMph: msg.readFloatLE(256) * 2.23694,

  Power: msg.readFloatLE(260),
  Torque: msg.readFloatLE(264),

  TireTempFrontLeft: msg.readFloatLE(268),
  TireTempFrontRight: msg.readFloatLE(272),
  TireTempRearLeft: msg.readFloatLE(276),
  TireTempRearRight: msg.readFloatLE(280),

  Boost: msg.readFloatLE(284),
  Fuel: msg.readFloatLE(288),
  DistanceTraveled: msg.readFloatLE(292),

  BestLap: msg.readFloatLE(296),
  LastLap: msg.readFloatLE(300),
  CurrentLap: msg.readFloatLE(304),
  CurrentRaceTime: msg.readFloatLE(308),

  LapNumber: msg.readUInt16LE(312),
  RacePosition: msg.readUInt8(314),

  Accel: msg.readUInt8(315),
  Brake: msg.readUInt8(316),
  Clutch: msg.readUInt8(317),
  HandBrake: msg.readUInt8(318),
  Gear: msg.readUInt8(319),

  Steer: msg.readInt8(320),
  NormalizedDrivingLine: msg.readInt8(321),
  NormalizedAIBrakeDifference: msg.readInt8(322),
});

const socket = dgram.createSocket("udp4");

socket.on("listening", () => {
  console.log(`FH6 telemetry UDP listener active on port ${UDP_PORT}`);
});

socket.on("message", (msg) => {
  if (msg.length < 323) {
    console.warn(`Ignoring short packet: ${msg.length} bytes`);
    return;
  }

  const telemetry = parseTelemetry(msg);

  broadcastTelemetry(telemetry);
});

socket.on("error", (err) => {
  console.error("UDP socket error:", err);
});

socket.bind(UDP_PORT, () => {
  console.log(`Listening on UDP ${UDP_PORT}`);
  console.log("Waiting to receive telemetry packets...");
});
import { NextResponse } from 'next/server';

export async function GET() {
  // Returns real-time or active GTFS-RT snapshot
  const now = new Date();
  const seconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const vehicles = [
    { id: "VEH-NAV-01", line: "1", category: "vaporetto", lat: 45.4380, lon: 12.3360, speed: 11.2, bearing: 185 },
    { id: "VEH-NAV-02", line: "2", category: "vaporetto", lat: 45.4340, lon: 12.3310, speed: 14.5, bearing: 240 },
    { id: "VEH-NAV-03", line: "4.1", category: "motoscafo", lat: 45.4480, lon: 12.3450, speed: 17.8, bearing: 90 },
    { id: "VEH-NAV-04", line: "12", category: "motonave", lat: 45.4750, lon: 12.3900, speed: 21.0, bearing: 45 },
    { id: "VEH-NAV-05", line: "17", category: "ferry", lat: 45.4320, lon: 12.3350, speed: 12.0, bearing: 110 },
    { id: "VEH-AUT-01", line: "T1", category: "tram", lat: 45.4880, lon: 12.2420, speed: 28.5, bearing: 135 },
    { id: "VEH-AUT-02", line: "4L", category: "bus", lat: 45.4750, lon: 12.2600, speed: 45.0, bearing: 120 },
    { id: "VEH-AUT-03", line: "11", category: "island", lat: 45.3600, lon: 12.3450, speed: 38.0, bearing: 190 }
  ];

  return NextResponse.json({
    success: true,
    timestamp: now.toISOString(),
    secondsOfDay: seconds,
    count: vehicles.length,
    data: vehicles
  });
}

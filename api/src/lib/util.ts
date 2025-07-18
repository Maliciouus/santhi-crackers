import axios from "axios";
import { getDistance } from "geolib";
import { nanoid } from "nanoid";
import { PasetoUtil } from "./paseto";

export async function calculateRoadDistance(
  hotelLat: number,
  hotelLon: number,
  userLat: number,
  userLon: number,
  waypoints: { lat: number; lon: number }[] = []
): Promise<{
  distance: { text: string; value: number };
  duration: { text: string; value: number };
  originAddress: string;
  destinationAddress: string;
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  const waypointsString = waypoints
    .map((point) => `${point.lat},${point.lon}`)
    .join("|");

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${hotelLat},${hotelLon}&destinations=${userLat},${userLon}&waypoints=${waypointsString}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== "OK") {
      throw new Error(`Error from Google Maps API: ${data.status}`);
    }

    return {
      distance: data.rows[0].elements[0].distance,
      duration: data.rows[0].elements[0].duration,
      originAddress: data.origin_addresses[0],
      destinationAddress: data.destination_addresses[0],
    };
  } catch (error) {
    console.error("Failed to calculate road distance:", error);
    throw new Error("Failed to fetch data from Google Maps API.");
  }
}

export function generateRandomString(length: number = 6, prefix = "#"): string {
  const characters = "0123456789";
  let result = "";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return prefix + result;
}

export function generateInvoiceId(): string {
  return generateRandomString(18, "INV-");
}

export const validateToken = async (token: string) => {
  if (!token || token.split(" ")[0] !== "Bearer") {
    throw new Error("Unauthorized");
  }

  let pasetoToken = token.split(" ")[1] ?? "";

  if (!pasetoToken.startsWith("v4.local.")) {
    throw new Error("Unauthorized");
  }

  const payload = await PasetoUtil.decodePaseto(pasetoToken);

  if (!payload) {
    throw new Error("Unauthorized");
  }

  return payload.payload;
};

export async function calculateDistance(
  hotelLat: string,
  hotelLon: string,
  userLat: string,
  userLon: string
) {
  const distanceInMeters = getDistance(
    { latitude: hotelLat, longitude: hotelLon },
    { latitude: userLat, longitude: userLon }
  );

  return distanceInMeters / 1000;
}

export function generateReferCode(length = 9) {
  let referCode = nanoid(length);
  return referCode;
}

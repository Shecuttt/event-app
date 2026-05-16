"use server";

import { v2 as cloudinary } from "cloudinary";
import { requireAuth } from "@/src/lib/auth";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function getCloudinarySignature() {
  await requireAuth();

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp: timestamp,
      folder: "event-app/posters",
    },
    process.env.CLOUDINARY_API_SECRET!
  );

  return {
    timestamp,
    signature,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    folder: "event-app/posters",
  };
}

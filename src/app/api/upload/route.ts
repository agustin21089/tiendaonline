import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";
import path from "path";
import fs from "fs/promises";

const useCloudinary =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET;

const isVercel = !!process.env.VERCEL;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || (session.user as { role?: string })?.role !== "ADMIN") {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return Response.json({ error: "No file provided" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  if (useCloudinary) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    try {
      const result = await new Promise<{ secure_url: string; public_id: string }>(
        (resolve, reject) => {
          cloudinary.uploader
            .upload_stream(
              {
                folder: "tienda",
                resource_type: "image",
                transformation: [{ quality: "auto", fetch_format: "auto" }],
              },
              (error, result) => {
                if (error || !result) reject(error);
                else resolve(result as { secure_url: string; public_id: string });
              },
            )
            .end(buffer);
        },
      );
      return Response.json({ url: result.secure_url, publicId: result.public_id });
    } catch (e) {
      console.error("Cloudinary upload error:", e);
      return Response.json({ error: "Error uploading to Cloudinary" }, { status: 500 });
    }
  }

  // On Vercel without Cloudinary, filesystem writes are not possible
  if (isVercel) {
    return Response.json(
      {
        error:
          "Cloudinary no está configurado. Agregá CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en las variables de entorno de Vercel, o usá la opción «Agregar por URL».",
      },
      { status: 503 },
    );
  }

  // Local development fallback — write to public/uploads/
  try {
    const ext = file.name.split(".").pop() ?? "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(path.join(uploadDir, filename), buffer);
    return Response.json({ url: `/uploads/${filename}`, publicId: filename });
  } catch (e) {
    console.error("Local upload error:", e);
    return Response.json({ error: "Error saving file locally" }, { status: 500 });
  }
}

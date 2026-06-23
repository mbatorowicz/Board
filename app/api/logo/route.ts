import { getOfficeLogo, readOfficeLogoFile } from "@/lib/logo";

export async function GET() {
  const file = await readOfficeLogoFile();
  if (!file) {
    return new Response("Brak logo.", { status: 404 });
  }

  const logo = await getOfficeLogo();

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
      ...(logo ? { "Last-Modified": new Date(logo.updatedAt).toUTCString() } : {}),
    },
  });
}

import { readAnnouncementFile } from "@/lib/announcement-files";

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id")?.trim();
  if (!id) {
    return new Response("Brak identyfikatora pliku.", { status: 400 });
  }

  const file = await readAnnouncementFile(id);
  if (!file) {
    return new Response("Plik nie istnieje.", { status: 404 });
  }

  const encoded = encodeURIComponent(file.filename).replace(/['()]/g, escape);

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encoded}`,
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}

import mammoth from "mammoth";
import fs from "node:fs/promises";

export async function convertDocxToHtml(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement((image) =>
        image.read("base64").then((imageBuffer) => ({
          src: `data:${image.contentType};base64,${imageBuffer}`,
        }))
      ),
    }
  );
  return result.value;
}

export function extractTocFromHtml(html: string): { id: string; text: string; level: number }[] {
  const headings: { id: string; text: string; level: number }[] = [];
  const regex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
  let match: RegExpExecArray | null;
  let index = 0;
  while ((match = regex.exec(html)) !== null) {
    const level = Number(match[1]);
    const text = match[2].replace(/<[^>]+>/g, "").trim();
    if (text) {
      headings.push({ id: `heading-${index++}`, text, level });
    }
  }
  return headings;
}

export function injectHeadingIds(html: string): string {
  let index = 0;
  return html.replace(/<h([1-6])([^>]*)>/gi, (_full, level: string, attrs: string) => {
    const id = `heading-${index++}`;
    if (attrs.includes("id=")) return `<h${level}${attrs}>`;
    return `<h${level}${attrs} id="${id}">`;
  });
}

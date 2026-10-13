import type { Recipe } from './recipes';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;

function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.split(/\\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

function makePdf(jpeg: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const ascii = (value: string) => encoder.encode(value);
  const content = ascii('q\\n595 0 0 842 0 0 cm\\n/Im0 Do\\nQ\\n');
  const objects: Uint8Array[] = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'),
    concatBytes([ascii(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\\nstream\\n`), jpeg, ascii('\\nendstream')]),
    concatBytes([ascii(`<< /Length ${content.length} >>\\nstream\\n`), content, ascii('endstream')]),
  ];
  const parts: Uint8Array[] = [ascii('%PDF-1.4\\n%âãÏÓ\\n')];
  const offsets = [0];
  let offset = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(offset);
    const wrapped = concatBytes([ascii(`${index + 1} 0 obj\\n`), object, ascii('\\nendobj\\n')]);
    parts.push(wrapped); offset += wrapped.length;
  });
  const xrefOffset = offset;
  parts.push(ascii(['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ', ...offsets.slice(1).map((position) => `${String(position).padStart(10, '0')} 00000 n `), 'trailer', `<< /Size ${objects.length + 1} /Root 1 0 R >>`, 'startxref', String(xrefOffset), '%%EOF', ''].join('\\n')));
  return concatBytes(parts);
}

function drawRecipe(recipe: Recipe, servings: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_WIDTH;
  canvas.height = PAGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar o PDF neste aparelho.');
  const green = '#173d32';
  const deepGreen = '#102d25';
  const gold = '#c5a45c';
  const ink = '#26352f';
  const muted = '#69766f';
  const paper = '#fbfaf6';
  const margin = 76;
  ctx.fillStyle = paper; ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);
  ctx.fillStyle = deepGreen; ctx.fillRect(0, 0, PAGE_WIDTH, 292);
  ctx.fillStyle = gold; ctx.fillRect(margin, 52, 7, 94);
  ctx.beginPath(); ctx.arc(margin + 45, 78, 30, 0, Math.PI * 2); ctx.fillStyle = gold; ctx.fill();
  ctx.fillStyle = deepGreen; ctx.font = 'bold 26px Arial, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('S', margin + 45, 79);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#fff'; ctx.font = 'bold 31px Arial, sans-serif'; ctx.fillText('SISTCS', margin + 88, 75);
  ctx.fillStyle = '#e2c77f'; ctx.font = 'bold 20px Arial, sans-serif'; ctx.fillText('LEVE', margin + 90, 105);
  ctx.fillStyle = '#dce7df'; ctx.font = '18px Arial, sans-serif'; ctx.fillText(`${recipe.category}  •  ${recipe.minutes} min  •  ${servings} ${servings === 1 ? 'porção' : 'porções'}`, margin, 171);
  ctx.fillStyle = '#fff'; ctx.font = 'bold 42px Georgia, serif';
  const titleLines = wrapText(ctx, recipe.name, PAGE_WIDTH - margin * 2);
  titleLines.slice(0, 2).forEach((line, i) => ctx.fillText(line, margin, 230 + i * 45));
  const contentTop = 335;
  const gap = 38;
  const columnWidth = (PAGE_WIDTH - margin * 2 - gap) / 2;
  const bottom = PAGE_HEIGHT - 115;
  const sections = [
    { title: 'INGREDIENTES', entries: recipe.ingredients.map((ingredient) => `•  ${ingredient}`) },
    { title: 'MODO DE PREPARO', entries: recipe.steps.map((step, index) => `${index + 1}.  ${step}`) },
  ];
  const layouts = sections.map((section) => {
    let fontSize = 22;
    let lineHeight = 31;
    let rows: string[][] = [];
    for (let attempt = 0; attempt < 10; attempt++) {
      ctx.font = `${fontSize}px Arial, sans-serif`;
      rows = section.entries.map((entry) => wrapText(ctx, entry, columnWidth - 24));
      const required = rows.reduce((sum, lines) => sum + lines.length * lineHeight + 12, 0);
      if (required <= bottom - contentTop - 90 || fontSize <= 15) break;
      fontSize -= 1; lineHeight = fontSize * 1.36;
    }
    return { ...section, fontSize, lineHeight, rows };
  });
  layouts.forEach((section, index) => {
    const x = margin + index * (columnWidth + gap);
    ctx.fillStyle = green; ctx.font = 'bold 23px Arial, sans-serif'; ctx.fillText(section.title, x, contentTop);
    ctx.fillStyle = gold; ctx.fillRect(x, contentTop + 14, 58, 4);
    let y = contentTop + 54;
    ctx.fillStyle = ink; ctx.font = `${section.fontSize}px Arial, sans-serif`;
    section.rows.forEach((lines) => {
      lines.forEach((line) => { if (y < bottom - 20) ctx.fillText(line, x, y); y += section.lineHeight; });
      y += 12;
    });
  });
  if (recipe.description) {
    ctx.fillStyle = muted; ctx.font = 'italic 16px Arial, sans-serif';
    const description = wrapText(ctx, recipe.description, PAGE_WIDTH - margin * 2);
    description.slice(0, 2).forEach((line, index) => ctx.fillText(line, margin, 307 + index * 20));
  }
  ctx.fillStyle = green; ctx.fillRect(0, PAGE_HEIGHT - 78, PAGE_WIDTH, 78);
  ctx.fillStyle = '#fff'; ctx.font = '17px Arial, sans-serif'; ctx.fillText('SISTCS LEVE  •  Sua rotina, com mais equilíbrio.', margin, PAGE_HEIGHT - 43);
  ctx.textAlign = 'right'; ctx.fillStyle = '#e2c77f'; ctx.font = '15px Arial, sans-serif'; ctx.fillText('RECEITA • PDF DIGITAL', PAGE_WIDTH - margin, PAGE_HEIGHT - 43); ctx.textAlign = 'left';
  return canvas;
}

export async function downloadRecipePdf(recipe: Recipe, servings = 1): Promise<void> {
  const canvas = drawRecipe(recipe, servings);
  const jpeg = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível gerar o PDF da receita.')), 'image/jpeg', 0.94);
  });
  const pdf = makePdf(new Uint8Array(await jpeg.arrayBuffer()));
  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const anchor = document.createElement('a');
  const safeName = recipe.name.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'receita';
  anchor.href = url;
  anchor.download = `sistcs-leve-receita-${safeName}.pdf`;
  anchor.style.display = 'none'; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

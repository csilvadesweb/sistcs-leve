import type { ShoppingIngredient } from './meal-plan';

const PAGE_WIDTH = 1240;
const PAGE_HEIGHT = 1754;
const PDF_WIDTH = 595;
const PDF_HEIGHT = 842;

function wrapText(ctx: CanvasRenderingContext2D, value: string, maxWidth: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function makePdf(jpeg: Uint8Array): Uint8Array {
  const encoder = new TextEncoder();
  const ascii = (value: string) => encoder.encode(value);
  const content = ascii('q\n595 0 0 842 0 0 cm\n/Im0 Do\nQ\n');
  const objects: Uint8Array[] = [
    ascii('<< /Type /Catalog /Pages 2 0 R >>'),
    ascii('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),
    ascii('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>'),
    concatBytes([
      ascii(`<< /Type /XObject /Subtype /Image /Width ${PAGE_WIDTH} /Height ${PAGE_HEIGHT} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg,
      ascii('\nendstream'),
    ]),
    concatBytes([ascii(`<< /Length ${content.length} >>\nstream\n`), content, ascii('endstream')]),
  ];

  const parts: Uint8Array[] = [ascii('%PDF-1.4\n%âãÏÓ\n')];
  const offsets = [0];
  let offset = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(offset);
    const wrapped = concatBytes([ascii(`${index + 1} 0 obj\n`), object, ascii('\nendobj\n')]);
    parts.push(wrapped);
    offset += wrapped.length;
  });
  const xrefOffset = offset;
  const xref = [
    'xref',
    `0 ${objects.length + 1}`,
    '0000000000 65535 f ',
    ...offsets.slice(1).map((position) => `${String(position).padStart(10, '0')} 00000 n `),
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    String(xrefOffset),
    '%%EOF',
    '',
  ].join('\n');
  parts.push(ascii(xref));
  return concatBytes(parts);
}

function drawShoppingList(items: ShoppingIngredient[], plannedCount: number): HTMLCanvasElement {
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
  const margin = 82;
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT);

  // Cabeçalho premium e marca vetorial criada no próprio documento.
  ctx.fillStyle = deepGreen;
  ctx.fillRect(0, 0, PAGE_WIDTH, 340);
  ctx.fillStyle = gold;
  ctx.fillRect(margin, 58, 8, 112);
  ctx.beginPath();
  ctx.arc(margin + 52, 88, 35, 0, Math.PI * 2);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.fillStyle = deepGreen;
  ctx.font = 'bold 28px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', margin + 52, 89);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 35px Arial, sans-serif';
  ctx.fillText('SISTCS', margin + 102, 84);
  ctx.fillStyle = '#e2c77f';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('LEVE', margin + 104, 116);
  ctx.fillStyle = '#dce7df';
  ctx.font = '20px Arial, sans-serif';
  ctx.fillText('NUTRIÇÃO • ORGANIZAÇÃO • BEM-ESTAR', margin, 205);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText('Lista de compras', margin, 278);
  ctx.fillStyle = '#e8dcc0';
  ctx.font = '21px Arial, sans-serif';
  ctx.fillText(`${plannedCount} ${plannedCount === 1 ? 'receita planejada' : 'receitas planejadas'}`, margin, 316);

  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date());
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText(date, PAGE_WIDTH - margin, 92);
  ctx.textAlign = 'left';

  const contentTop = 395;
  const contentBottom = PAGE_HEIGHT - 115;
  const contentHeight = contentBottom - contentTop;
  const columns = items.length > 46 ? 3 : 2;
  const gap = 28;
  const columnWidth = (PAGE_WIDTH - margin * 2 - gap * (columns - 1)) / columns;
  const distributed = Array.from({ length: columns }, () => [] as ShoppingIngredient[]);
  items.forEach((item, index) => distributed[index % columns].push(item));

  let fontSize = columns === 3 ? 19 : 23;
  let lineHeight = fontSize * 1.36;
  let itemGap = columns === 3 ? 12 : 16;
  let wrapped: string[][][] = [];
  for (let attempt = 0; attempt < 10; attempt++) {
    ctx.font = `${fontSize}px Arial, sans-serif`;
    wrapped = distributed.map((column) => column.map((item) => wrapText(ctx, item.ingredient, columnWidth - 34)));
    const heights = wrapped.map((column) => column.reduce((sum, lines) => sum + Math.max(lineHeight, lines.length * lineHeight) + itemGap, 0));
    if (Math.max(0, ...heights) <= contentHeight || fontSize <= 14) break;
    fontSize -= 1;
    lineHeight = fontSize * 1.34;
    itemGap = Math.max(7, itemGap - 1);
  }

  ctx.fillStyle = green;
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('SEPARAR E CONFERIR', margin, 375);
  ctx.strokeStyle = '#deded2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(margin, 390);
  ctx.lineTo(PAGE_WIDTH - margin, 390);
  ctx.stroke();

  distributed.forEach((column, columnIndex) => {
    let y = contentTop;
    const x = margin + columnIndex * (columnWidth + gap);
    column.forEach((item, itemIndex) => {
      const lines = wrapped[columnIndex]?.[itemIndex] ?? [item.ingredient];
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#e1e4dc';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, y + 1, 25, 25, 6);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = ink;
      ctx.font = `${fontSize}px Arial, sans-serif`;
      lines.forEach((line, lineIndex) => ctx.fillText(line, x + 38, y + 21 + lineIndex * lineHeight));
      if (item.count > 1) {
        ctx.fillStyle = muted;
        ctx.font = `${Math.max(13, fontSize - 5)}px Arial, sans-serif`;
        ctx.fillText(`Usado em ${item.count} receitas`, x + 38, y + 21 + lines.length * lineHeight);
      }
      y += Math.max(lineHeight, lines.length * lineHeight) + itemGap + (item.count > 1 ? 12 : 0);
    });
  });

  ctx.fillStyle = green;
  ctx.fillRect(0, PAGE_HEIGHT - 83, PAGE_WIDTH, 83);
  ctx.fillStyle = '#ffffff';
  ctx.font = '18px Arial, sans-serif';
  ctx.fillText('SISTCS LEVE  •  Sua rotina, com mais equilíbrio.', margin, PAGE_HEIGHT - 47);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#e2c77f';
  ctx.font = '16px Arial, sans-serif';
  ctx.fillText('PDF DIGITAL • 1 PÁGINA', PAGE_WIDTH - margin, PAGE_HEIGHT - 47);
  ctx.textAlign = 'left';
  return canvas;
}

/** Gera um PDF A4 de uma única página e inicia o download sem abrir a tela de impressão. */
export async function downloadShoppingListPdf(items: ShoppingIngredient[], plannedCount: number): Promise<void> {
  if (!items.length) throw new Error('Adicione receitas ao planejamento antes de gerar a lista.');
  const canvas = drawShoppingList(items, plannedCount);
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Não foi possível gerar a imagem do PDF.')), 'image/jpeg', 0.94);
  });
  const pdf = makePdf(new Uint8Array(await jpegBlob.arrayBuffer()));
  const blob = new Blob([pdf], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `sistcs-leve-lista-de-compras-${new Date().toISOString().slice(0, 10)}.pdf`;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

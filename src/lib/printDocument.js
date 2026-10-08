/**
 * Abre una ventana con un documento de texto + imagen de firma lista para
 * imprimir o «Guardar como PDF». Todo el contenido se escapa: el texto viene
 * de la base de datos y no debe poder inyectar HTML.
 */
export const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Solo se acepta una imagen PNG en base64 como firma. */
export const safeSignatureSrc = (src) =>
  typeof src === 'string' && /^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(src) ? src : '';

/** Solo se acepta una foto JPEG en base64. */
export const safePhotoSrc = (src) =>
  typeof src === 'string' && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src) ? src : '';

export const buildPrintableHtml = ({ title, text, signatureSrc, photoSrc, footerLines = [] }) => `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  body{font-family:Arial,Helvetica,sans-serif;margin:32px;color:#111;line-height:1.5;font-size:13px}
  h1{font-size:18px;margin:0 0 16px}
  pre{white-space:pre-wrap;font-family:inherit;margin:0}
  .photo{width:110px;height:110px;border-radius:50%;object-fit:cover;border:1px solid #999;margin-bottom:12px}
  .sig{margin-top:28px;border-top:1px solid #999;padding-top:8px;width:320px}
  .sig img{max-width:300px;height:auto;display:block}
  .meta{margin-top:24px;font-size:11px;color:#444;word-break:break-all}
</style></head><body>
<h1>${escapeHtml(title)}</h1>
${safePhotoSrc(photoSrc) ? `<img class="photo" alt="Fotografía" src="${safePhotoSrc(photoSrc)}">` : ''}
<pre>${escapeHtml(text)}</pre>
<div class="sig">${safeSignatureSrc(signatureSrc) ? `<img alt="Firma" src="${safeSignatureSrc(signatureSrc)}">` : ''}<div>Firma</div></div>
<div class="meta">${footerLines.map(escapeHtml).join('<br>')}</div>
</body></html>`;

export const printDocument = (options) => {
  const win = window.open('', '_blank', 'noopener=no,width=900,height=1000');
  if (!win) return false; // bloqueador de ventanas emergentes
  win.document.open();
  win.document.write(buildPrintableHtml(options));
  win.document.close();
  win.focus();
  win.onload = () => win.print();
  setTimeout(() => { try { win.print(); } catch { /* ya se imprimió o se cerró */ } }, 600);
  return true;
};

/**

 * Разбивает HTML/CSS/JS на фрагменты ≤ maxBytes для блоков T123 Tilda (~100 КБ).

 */

const MAX_BYTES = 95_000;



const HIDDEN_OPEN =

  '<div class="pnae-t123-svc" style="display:none!important;position:absolute!important;left:-9999px!important;width:0!important;height:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;margin:0!important;padding:0!important;border:0!important;" aria-hidden="true">';

const HIDDEN_CLOSE = "</div>";



function byteLen(s) {

  return Buffer.byteLength(s, "utf8");

}



function chunkString(text, maxBytes) {

  const chunks = [];

  let i = 0;

  while (i < text.length) {

    let end = Math.min(text.length, i + maxBytes);

    while (end > i && byteLen(text.slice(i, end)) > maxBytes) end--;

    if (end === i) end = Math.min(text.length, i + 1);

    chunks.push(text.slice(i, end));

    i = end;

  }

  return chunks;

}



function extractSingleFileHtml(html) {

  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);

  const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/i);

  return {

    css: styleMatch?.[1]?.trim() ?? "",

    js: scriptMatch?.[1]?.trim() ?? "",

  };

}



function wrapHidden(content) {

  return `${HIDDEN_OPEN}${content}${HIDDEN_CLOSE}`;

}



const BOOTSTRAP = `<div id="root" class="pnae-tilda-embed"></div>
<style>
#root.pnae-tilda-embed{display:block!important;width:100%!important;max-width:1200px!important;margin:0 auto!important;overflow-x:clip!important;overflow-y:visible!important;box-sizing:border-box!important;background:#fff!important;font-size:1.3125rem!important;line-height:1.55!important;}
.t-rec:has(#root.pnae-tilda-embed),.t-rec:has(.pnae-t123-svc){background:#fff!important;padding-top:0!important;padding-bottom:0!important;overflow-y:visible!important;}
.t-rec:has(#root.pnae-tilda-embed) .t-container,.t-rec:has(#root.pnae-tilda-embed) .t-col{width:100%!important;max-width:1200px!important;margin:0 auto!important;box-sizing:border-box!important;}
</style>
<script>
window.__PNAE_CSS=window.__PNAE_CSS||[];
window.__PNAE_B64_CHUNKS=window.__PNAE_B64_CHUNKS||[];
window.__PNAE_JS=window.__PNAE_JS||[];
</script>`;



const RUNNER = `<script>

(function(){

  var css=(window.__PNAE_CSS||[]).join("");

  if(css){

    var st=document.createElement("style");

    st.setAttribute("data-pnae","1");

    st.textContent=css;

    document.head.appendChild(st);

  }

  var parts=window.__PNAE_JS;

  if(!parts||!parts.length)return;

  var code=parts.join("");

  var el=document.createElement("script");

  el.textContent=code;

  document.body.appendChild(el);

})();

</script>`;



/**

 * @param {{ css: string, js: string, dataB64: string, rootId?: string }} parts

 * @returns {{ index: number, bytes: number, content: string, hidden: boolean }[]}

 */

export function splitForT123({ css, js, dataB64 }) {

  const blocks = [];

  let index = 1;



  const push = (content, hidden = false) => {

    const wrapped = hidden ? wrapHidden(content) : content;

    blocks.push({ index: index++, bytes: byteLen(wrapped), content: wrapped, hidden });

  };



  push(BOOTSTRAP, false);



  chunkString(css, MAX_BYTES).forEach((chunk) => {

    push(

      `<script>

window.__PNAE_CSS=window.__PNAE_CSS||[];

window.__PNAE_CSS.push(${JSON.stringify(chunk)});

</script>`,

      true

    );

  });



  chunkString(dataB64, MAX_BYTES).forEach((chunk) => {

    push(

      `<script>

window.__PNAE_B64_CHUNKS=window.__PNAE_B64_CHUNKS||[];

window.__PNAE_B64_CHUNKS.push(${JSON.stringify(chunk)});

</script>`,

      true

    );

  });



  chunkString(js, MAX_BYTES).forEach((chunk) => {

    push(

      `<script>

window.__PNAE_JS=window.__PNAE_JS||[];

window.__PNAE_JS.push(${JSON.stringify(chunk)});

</script>`,

      true

    );

  });



  push(RUNNER, true);



  return blocks;

}



export function splitSingleFileHtml(html, dataB64) {

  const { css, js } = extractSingleFileHtml(html);

  if (!js) throw new Error("Не найден <script> в single-file HTML");

  return splitForT123({ css, js, dataB64 });

}



export { MAX_BYTES, byteLen };



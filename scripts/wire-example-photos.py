from pathlib import Path

p = Path(__file__).resolve().parents[1] / "public" / "static" / "app.js"
text = p.read_text(encoding="utf-8")

start = text.find("    const EXAMPLES = {")
end = text.find("  // ── PREP SCREEN:", start)
if start < 0 or end < 0:
    raise SystemExit(f"markers missing {start} {end}")

new_examples = r'''    const EXAMPLES = {
      dial: { good: 'Dial fills the frame, straight-on, logo crisp, no glare', bad: 'Lifestyle angle, too far, scene stealing the face', goodSrc: '/static/examples/dial-good.jpg', badSrc: '/static/examples/dial-bad.jpg' },
      macro: { good: 'Serial / engraving fills the frame and is fully readable', bad: 'Too far — characters too small, motion blur', goodSrc: '/static/examples/macro-good.jpg', badSrc: '/static/examples/macro-bad.jpg' },
      card: { good: 'Document flat, square, even light, reference readable', bad: 'Curled paper, shadow band across the text', goodSrc: '/static/examples/card-good.jpg', badSrc: '/static/examples/card-bad.jpg' },
      bag: { good: 'Whole bag front-on, handles up, silhouette complete', bad: 'Side angle, hardware and shape distorted', goodSrc: '/static/examples/bag-good.jpg', badSrc: '/static/examples/bag-bad.jpg' },
      gem: { good: 'Piece centered on a plain ground, facets catching light', bad: 'Tilted, glare wash, subject lost in the frame', goodSrc: '/static/examples/gem-good.jpg', badSrc: '/static/examples/gem-bad.jpg' },
      car: { good: '3/4 front, full nose in frame, badge readable', bad: 'Cropped, harsh shadow across the panels', goodSrc: '/static/examples/car-good.jpg', badSrc: '/static/examples/car-bad.jpg' },
      dash: { good: 'Cluster sharp, odometer digits clearly readable', bad: 'Reflection washing out the display', goodSrc: '/static/examples/dash-good.jpg', badSrc: '/static/examples/dash-bad.jpg' },
      art: { good: 'Whole work edge-to-edge, square, glare-free', bad: 'Skewed from the side with a glare hotspot', goodSrc: '/static/examples/art-good.jpg', badSrc: '/static/examples/art-bad.jpg' },
    }
    function examplePairHtml(ex, compact) {
      if (!ex) return ''
      const h = compact ? 'h-24' : 'h-44'
      return `<div class="cl-ex-pair grid grid-cols-2 gap-2">
        <figure class="cl-ex-good m-0">
          <div class="${h} rounded-lg overflow-hidden border border-emerald-500/40 bg-black">
            <img src="${ex.goodSrc}" alt="Like this" class="w-full h-full object-cover" loading="lazy"/>
          </div>
          <figcaption class="mt-1.5 text-[10px] leading-snug text-emerald-300/90"><span class="font-mono uppercase tracking-wide text-[9px]">✓ Like this</span> — ${ex.good}</figcaption>
        </figure>
        <figure class="cl-ex-bad m-0">
          <div class="${h} rounded-lg overflow-hidden border border-rose-500/40 bg-black">
            <img src="${ex.badSrc}" alt="Not this" class="w-full h-full object-cover" loading="lazy"/>
          </div>
          <figcaption class="mt-1.5 text-[10px] leading-snug text-rose-300/90"><span class="font-mono uppercase tracking-wide text-[9px]">✗ Not this</span> — ${ex.bad}</figcaption>
        </figure>
      </div>`
    }

'''
text = text[:start] + new_examples + text[end:]

hs = text.find("  const PREP_HEROES = {")
he = text.find("  const PREP_HERO_TITLES = {", hs)
if hs < 0 or he < 0:
    raise SystemExit(f"prep heroes missing {hs} {he}")
new_heroes = """  const PREP_HEROES = {
    Watches: '<img src=\"/static/examples/prep-dial.jpg\" alt=\"Watch capture reference\" class=\"w-full h-[190px] object-cover rounded-xl\"/>',
    Handbags: '<img src=\"/static/examples/prep-bag.jpg\" alt=\"Handbag capture reference\" class=\"w-full h-[190px] object-cover rounded-xl\"/>',
    'Fine Jewelry': '<img src=\"/static/examples/prep-gem.jpg\" alt=\"Jewelry capture reference\" class=\"w-full h-[190px] object-cover rounded-xl\"/>',
    'Luxury Vehicles': '<img src=\"/static/examples/prep-car.jpg\" alt=\"Vehicle capture reference\" class=\"w-full h-[190px] object-cover rounded-xl\"/>',
    'Art & Collectibles': '<img src=\"/static/examples/prep-art.jpg\" alt=\"Artwork capture reference\" class=\"w-full h-[190px] object-cover rounded-xl\"/>',
  };
"""
text = text[:hs] + new_heroes + text[he:]

old_callout = "For <span class=\"text-gold font-semibold\">best analysis &amp; accuracy</span>: shoot <span class=\"text-white font-semibold\">straight-on</span> (phone parallel to the surface), fill the frame with the detail, use <span class=\"text-white font-semibold\">soft, even light</span> — no glare, and hold steady for 1s before tapping the shutter."
new_callout = "Copy these photos, not a drawing of them. <span class=\"text-white font-semibold\">Straight-on, fill the frame, serial readable, no glare.</span> High confidence needs a hero plus a macro serial. Phone photos will not hit 99% authenticity — they produce a strong review-grade file."
if old_callout not in text:
    raise SystemExit("callout missing")
text = text.replace(old_callout, new_callout, 1)

old_gal = """                <div class=\"cl-example-svg w-full\">${ex.svg}</div>
                <div class=\"mt-2.5 grid grid-cols-2 gap-2\">
                  <div class=\"rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-2.5 py-1.5\">
                    <p class=\"text-[9px] font-mono text-emerald-400 uppercase tracking-wide mb-0.5\">✓ Like this</p>
                    <p class=\"text-[10.5px] text-white/70 leading-snug\">${ex.good}</p>
                  </div>
                  <div class=\"rounded-lg border border-rose-500/25 bg-rose-500/5 px-2.5 py-1.5\">
                    <p class=\"text-[9px] font-mono text-rose-400 uppercase tracking-wide mb-0.5\">✗ Not this</p>
                    <p class=\"text-[10.5px] text-white/70 leading-snug\">${ex.bad}</p>
                  </div>
                </div>"""
new_gal = """                <div class=\"cl-example-photos w-full\">${examplePairHtml(ex, false)}</div>"""
if old_gal not in text:
    raise SystemExit("gallery block missing")
text = text.replace(old_gal, new_gal, 1)

text = text.replace(
    '<div id="cl-example-svg" class="w-full" style="max-height:110px; overflow:hidden;"></div>',
    '<div id="cl-example-svg" class="w-full"></div>',
    1,
)
text = text.replace(
    "          if (exSvg) exSvg.innerHTML = ex.svg",
    "          if (exSvg) exSvg.innerHTML = examplePairHtml(ex, true)",
    1,
)

old_gate = """    if (images.filter(Boolean).length === 0 && !descriptionInput?.value.trim()) {
      toast('Take a photo or describe the item first', 'warning');
      return;
    }

    const filledImages = images.filter(Boolean)          // drop undefined holes"""
new_gate = """    if (images.filter(Boolean).length === 0 && !descriptionInput?.value.trim()) {
      toast('Take a photo or describe the item first', 'warning');
      return;
    }

    const filledImages = images.filter(Boolean)          // drop undefined holes
    const hasMacro = filledImages.some(i => i.tier === 'macro')
    const hasHero = filledImages.some(i => i.tier === 'hero')
    if (filledImages.length && (!hasHero || !hasMacro)) {
      toast('For a real verdict capture the hero and a readable serial/macro. This run will stay review-only.', 'warning')
    }"""
if old_gate not in text:
    raise SystemExit("analyze gate missing")
text = text.replace(old_gate, new_gate, 1)

old_toast = "toast(res.stored ? 'Asset authenticated and stored' : 'Analysis complete \\u2014 review required', res.stored ? 'success' : 'warning');"
new_toast = "toast(data.authenticityStatus === 'AUTHENTIC MATCH' ? 'Authenticated and stored' : (data.stored ? 'Stored for review' : 'Analysis complete — review required'), data.authenticityStatus === 'AUTHENTIC MATCH' ? 'success' : 'warning');"
if old_toast not in text:
    raise SystemExit("toast missing")
text = text.replace(old_toast, new_toast, 1)

p.write_text(text, encoding="utf-8")
print("wired", p)
print("pair", "examplePairHtml" in text)
print("photos", "prep-dial.jpg" in text)
print("svg leftovers", text.count("ex.svg"))

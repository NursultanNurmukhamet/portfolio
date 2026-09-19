# Personal projects block

`dist/index.html#projects` now includes AgentF, MetaCrypt and ULMusic as individual RU/EN slides 04–06 in the existing zigzag gallery. ULMusic is the requested display name for the former shut-up-and-listen project; its bot address is unchanged. The former standalone section and its stylesheet were removed to avoid duplicate content. Existing local artwork and screenshots are reused; no added dependencies or remote media requests.

## Verified descriptions, 2026-09-19

- [AgentF](https://github.com/NursultanNurmukhamet/AgentF): public README describes five football AI agents using Python, Nova Micro and AgentCore, with fallback logic. Three actual match screenshots from the existing portfolio show SapaTech defeating Total Attack United 2:1, The Benchmark FC 2:0 and Fort Knox Athletic 2:0. Copies are unmodified; dimensions are verified in tests. These are separate match wins, not a tournament-placement claim. The cover and a dedicated button open the full-size match viewer.
- [MetaCrypt](https://github.com/NursultanNurmukhamet/MetaCrypt): public README describes a browser-based image metadata editor and encrypted vault, with React, TypeScript and Web Crypto. No security certification, perfect privacy or support for editing all image formats is claimed.
- shut-up-and-listen: the available local source confirms an aiogram media bot with yt-dlp, FFmpeg, queued downloads/conversion and clip handling. No open-source licensing claim is made.

Requested actions: AgentF opens its GitHub repository, MetaCrypt opens https://nursultannurmukhamet.github.io/MetaCrypt/, and ULMusic opens https://t.me/ShutUpandListen_Bot. These destinations were supplied by the user; testing the links does not imply a verified live service.

The owner explicitly supplied the public direct contacts https://t.me/NurmukhametNursultan and https://wa.me/77000225339. Both replace the pending-contact notice. WhatsApp can open a prepared draft but never sends automatically. No Telegram token or recipient configuration changed.

## Integration

Slide count, alternating camera direction, pagination, gallery height and chapter destinations derive from the six projects. Contact follows the sixth slide and retains native reading scroll. Static/reduced-motion mode displays all six. The university cover uses a dark forest background with lime heading for stronger contrast. This revision has not been pushed.

## Verification

- Gallery math and chapter tests cover every stop in both directions, alternating legs, endpoints, reading plateaus, a single project, six-slide contact entry and static reading. Integration checks cover all three exact destination URLs and removal of the duplicate section.
- Browser checks cover the default two-column layout and narrow stacked layouts, six pagination controls, actual destination links and the high-contrast university cover.
- The separate existing Cloudflare runtime integration test could not launch workerd (`spawn EPERM`); this front-end change does not modify the Worker or form.

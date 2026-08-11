# Explore Asset Manifest

The SleepOS demo serves the supplied BodyParts3D viewer dependencies from its own origin so Explore does not depend on third-party runtime availability.

| Asset | Source version or supplied origin | Bytes | SHA-256 |
|---|---|---:|---|
| `vendor/three.module.js` | Three.js 0.160.0, jsDelivr npm mirror | 1,272,972 | `76DEA8151BC9352AEF3528B4262E249B2604F62543828328DB978D060D61A495` |
| `vendor/loaders/GLTFLoader.js` | Three.js 0.160.0, jsDelivr npm mirror | 108,522 | `D073B438E6A07E1359741DD5D6C76C953420CC0D4FD84EB1BDDE94315540E6A3` |
| `vendor/utils/BufferGeometryUtils.js` | Three.js 0.160.0, jsDelivr npm mirror | 31,906 | `9BE041E96308775D00E2695CC607645B9A9B64FD7C0E759DD8F7C00A8D92BECB` |
| `vendor/gsap.min.js` | GSAP 3.12.5, jsDelivr npm mirror | 72,214 | `28033E449A31EBCC396E5BE8B13B63152BF03094288FB5867034321927BCE087` |
| `models/body.glb` | Supplied prototype URL `bodyparts3d-glass-v11.vercel.app/body.glb` | 3,553,004 | `8CFE2DEE02CBB99C20190D4DEF49E2DEC68B3FBF9DC92DF3F7EC61B6370D15F2` |
| `models/skin-v6.glb` | Supplied prototype URL `bodyparts3d-v6-skin-asset.vercel.app/skin-v6.glb` | 2,717,016 | `DB783C5DA54114420FC3AAE88214217B18A8E6CBBCBCA45BD57E5B0730AFE33D` |

Three.js and GSAP version metadata is recorded above. Product-owner confirmation of the two GLB files' ownership and redistribution license remains required before a public production release. The current authorization is limited to the user-supplied prototype and this local competition/demo implementation.

Muscle and metabolic overlays are intentionally fixed, labeled stage regions; they do not track body rotation and do not claim verified anatomy.

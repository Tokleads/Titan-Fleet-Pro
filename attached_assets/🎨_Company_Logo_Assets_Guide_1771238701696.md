# 🎨 Company Logo Assets Guide

## 📋 Overview

This guide provides instructions for downloading and using company logos on the TitanFleet landing page to showcase integrations and build authority.

---

## 🏢 Company Logos Required

### **1. Resend**

**Download:** https://resend.com/brand

**File to use:** 
- SVG: `resend-logo.svg` (preferred)
- PNG: `resend-logo.png` (fallback)

**Usage Guidelines:**
- ✅ Use dark logo on light backgrounds
- ✅ Minimum width: 100px
- ✅ Clear space: 20px around logo
- ❌ Don't modify colors or proportions
- ❌ Don't add effects or shadows

**Color:** 
- Primary: `#000000` (black)
- Background: `#FFFFFF` (white)

---

### **2. Stripe**

**Download:** https://stripe.com/newsroom/brand-assets

**File to use:**
- SVG: `stripe-logo.svg` (preferred)
- PNG: `stripe-logo.png` (fallback)

**Usage Guidelines:**
- ✅ Use purple logo (#635BFF) or black logo
- ✅ Minimum height: 28px
- ✅ Clear space: Equal to height of logo
- ❌ Don't stretch or distort
- ❌ Don't change colors

**Color:**
- Primary: `#635BFF` (Stripe purple)
- Alternative: `#000000` (black)

---

### **3. Xero**

**Download:** https://www.xero.com/uk/about/media/

**File to use:**
- SVG: `xero-logo.svg` (preferred)
- PNG: `xero-logo.png` (fallback)

**Usage Guidelines:**
- ✅ Use blue logo (#13B5EA)
- ✅ Minimum width: 80px
- ✅ Clear space: 15px around logo
- ❌ Don't modify or distort
- ❌ Don't use on busy backgrounds

**Color:**
- Primary: `#13B5EA` (Xero blue)

---

### **4. QuickBooks (Intuit)**

**Download:** https://quickbooks.intuit.com/press-room/

**File to use:**
- SVG: `quickbooks-logo.svg` (preferred)
- PNG: `quickbooks-logo.png` (fallback)

**Usage Guidelines:**
- ✅ Use green logo (#2CA01C)
- ✅ Minimum width: 100px
- ✅ Clear space: 20px around logo
- ❌ Don't alter colors
- ❌ Don't rotate or skew

**Color:**
- Primary: `#2CA01C` (QuickBooks green)

---

### **5. OpenStreetMap**

**Download:** https://wiki.openstreetmap.org/wiki/Logo

**Direct link:** https://wiki.openstreetmap.org/w/images/7/79/Public-images-osm_logo.svg

**File to use:**
- SVG: `openstreetmap-logo.svg` (preferred)
- PNG: `openstreetmap-logo.png` (fallback)

**Usage Guidelines:**
- ✅ Use official logo with magnifying glass
- ✅ Minimum width: 80px
- ✅ Include attribution if required: "© OpenStreetMap contributors"
- ❌ Don't modify the logo
- ❌ Don't use without attribution in certain contexts

**Color:**
- Primary: Multi-color (green, blue, orange)

---

## 📁 File Structure

Save logos in your project:

```
client/public/integrations/
├── resend-logo.svg
├── stripe-logo.svg
├── xero-logo.svg
├── quickbooks-logo.svg
└── openstreetmap-logo.svg
```

**Alternative (if SVG not available):**

```
client/public/integrations/
├── resend-logo.png
├── stripe-logo.png
├── xero-logo.png
├── quickbooks-logo.png
└── openstreetmap-logo.png
```

---

## 🎨 Logo Specifications

### **Recommended Sizes:**

**For landing page integration cards:**
- Height: 32px (h-8 in Tailwind)
- Width: Auto (maintain aspect ratio)
- Format: SVG (preferred) or PNG

**For trust bar:**
- Height: 24px (h-6 in Tailwind)
- Width: Auto
- Format: SVG (preferred) or PNG
- Effect: Grayscale by default, color on hover

---

## 🖼️ Implementation Example

### **Integration Card:**

```tsx
<div className="bg-white p-3 rounded-lg shadow-sm border">
  <img
    src="/integrations/resend-logo.svg"
    alt="Resend logo"
    className="h-8 w-auto object-contain"
  />
</div>
```

### **Trust Bar:**

```tsx
<div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
  <img
    src="/integrations/resend-logo.svg"
    alt="Resend logo"
    className="h-6 w-auto object-contain grayscale hover:grayscale-0 transition-all"
  />
  <img
    src="/integrations/stripe-logo.svg"
    alt="Stripe logo"
    className="h-6 w-auto object-contain grayscale hover:grayscale-0 transition-all"
  />
  {/* ... more logos ... */}
</div>
```

---

## 🔍 Alternative: Use CDN Links

If you can't download logos, use CDN links (less reliable):

```tsx
// Resend (example - check if available)
<img src="https://resend.com/static/logo.svg" alt="Resend" />

// Stripe
<img src="https://cdn.brandfolder.io/KGT2DTA4/as/8g3bc3-stripe-logo.svg" alt="Stripe" />

// Note: CDN links may change or break. Local files are more reliable.
```

---

## ✅ Logo Checklist

Before going live:

- [ ] All 5 logos downloaded and saved to `client/public/integrations/`
- [ ] Logos display correctly on landing page
- [ ] Logos maintain aspect ratio (not stretched)
- [ ] Clear space around logos (no crowding)
- [ ] Logos visible on both light and dark backgrounds
- [ ] Grayscale effect works on trust bar
- [ ] Hover effect works (grayscale → color)
- [ ] Alt text added for accessibility
- [ ] Fallback handling if logo fails to load
- [ ] Mobile responsive (logos scale appropriately)

---

## 🎨 Design Tips

### **Color Scheme:**

Use company brand colors for accent elements:

```css
/* Resend */
--resend-primary: #000000;

/* Stripe */
--stripe-primary: #635BFF;

/* Xero */
--xero-primary: #13B5EA;

/* QuickBooks */
--quickbooks-primary: #2CA01C;

/* OpenStreetMap */
--osm-primary: #7EBC6F;
```

### **Layout:**

**Integration cards:**
- White background for logo container
- Subtle shadow and border
- Rounded corners (8px)
- Padding: 12px

**Trust bar:**
- Grayscale by default (60% opacity)
- Color on hover (100% opacity)
- Smooth transition (300ms)
- Centered alignment

---

## 📊 Logo Dimensions Reference

| Company | Aspect Ratio | Recommended Width | Recommended Height |
|---------|--------------|-------------------|-------------------|
| Resend | ~3:1 | 120px | 40px |
| Stripe | ~4:1 | 100px | 25px |
| Xero | ~3:1 | 90px | 30px |
| QuickBooks | ~4:1 | 120px | 30px |
| OpenStreetMap | 1:1 | 80px | 80px |

**Note:** These are approximate. Always maintain original aspect ratio.

---

## 🔒 Legal Compliance

### **Trademark Usage:**

✅ **Allowed:**
- Showing logos to indicate integration support
- Using logos in product screenshots
- Displaying logos in marketing materials

❌ **Not Allowed:**
- Implying endorsement without permission
- Modifying logos without permission
- Using logos as your own branding

### **Attribution:**

**OpenStreetMap requires attribution:**
```html
<!-- Add to footer or near map -->
<p className="text-xs text-muted-foreground">
  Maps © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>
</p>
```

**Other logos:**
- No attribution required for integration showcase
- Follow brand guidelines for usage

---

## 🆘 Troubleshooting

### **Logo not displaying:**

1. Check file path: `/integrations/resend-logo.svg`
2. Verify file exists in `client/public/integrations/`
3. Check browser console for 404 errors
4. Try PNG fallback if SVG fails

### **Logo stretched or distorted:**

1. Use `object-contain` class
2. Set height, let width be `auto`
3. Don't set both width and height

### **Logo too small/large:**

1. Adjust Tailwind height class: `h-6`, `h-8`, `h-10`
2. Maintain aspect ratio with `w-auto`
3. Test on mobile devices

### **Logo not visible on dark background:**

1. Add white background container
2. Use logo version with transparent background
3. Add subtle border for definition

---

## 📚 Resources

### **Official Brand Guidelines:**

- **Resend:** https://resend.com/brand
- **Stripe:** https://stripe.com/newsroom/brand-assets
- **Xero:** https://www.xero.com/uk/about/media/
- **QuickBooks:** https://quickbooks.intuit.com/press-room/
- **OpenStreetMap:** https://wiki.openstreetmap.org/wiki/Logo

### **Logo Optimization Tools:**

- **SVGOMG:** https://jakearchibald.github.io/svgomg/ (optimize SVG files)
- **TinyPNG:** https://tinypng.com/ (compress PNG files)
- **Squoosh:** https://squoosh.app/ (image compression)

---

## ✅ Quick Start

1. **Download logos** from official brand pages
2. **Save to** `client/public/integrations/`
3. **Name files:**
   - `resend-logo.svg`
   - `stripe-logo.svg`
   - `xero-logo.svg`
   - `quickbooks-logo.svg`
   - `openstreetmap-logo.svg`
4. **Verify** logos display on landing page
5. **Test** on mobile and desktop
6. **Check** legal compliance and attribution

---

**Done! Your landing page now has professional company logos that build authority and trust.** 🎨✨

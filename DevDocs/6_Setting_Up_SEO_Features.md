# Setting Up SEO Features in FeNAgO

## Introduction

Search Engine Optimization (SEO) is critical for ensuring your web application is discoverable by users through search engines. This guide will walk you through implementing and optimizing SEO features in your FeNAgO application, leveraging Next.js's powerful built-in SEO capabilities along with custom helper functions provided in the codebase.

## Prerequisites

- A Next.js application (FeNAgO)
- Basic understanding of SEO concepts
- Access to the `config.ts` and `libs/seo.ts` files

## Step 1: Configure Basic SEO Settings

Start by setting up your basic SEO information in the `config.ts` file. These values will serve as the default SEO tags for your entire application.

```typescript
// In config.ts
export const config = {
  appName: "FeNAgO",
  appDescription: "The NextJS boilerplate with all you need to build your SaaS, AI tool, or any other web app.",
  domainName: "fenago.com", // Without https://www
  // Other config options...
};
```

These values are particularly important:
- `appName`: Used in titles, metadata, and various SEO tags
- `appDescription`: Used as the default description for pages
- `domainName`: Used for canonical URLs and other domain-specific SEO tags

## Step 2: Understanding the SEO Helper Functions

The FeNAgO codebase includes a powerful SEO helper library located at `libs/seo.ts`. This library provides functions to generate appropriate SEO tags for your pages.

### Key Functions

1. **getSEOTags()**
   - Generates all essential SEO meta tags for a page
   - Can be customized for individual pages
   - Includes Open Graph and Twitter Card tags

2. **renderSchemaTags()**
   - Adds structured data (JSON-LD) to pages
   - Helps search engines better understand your content
   - Can improve search result appearance with rich snippets

## Step 3: Adding SEO Tags to Specific Pages

Next.js 13+ uses a metadata API that makes it easy to add SEO tags to your pages. The `getSEOTags()` function simplifies this process by providing default values while allowing customization.

Here's how to add custom SEO tags to a specific page:

```typescript
// In app/tos/page.tsx
import { getSEOTags } from "@/libs/seo";

export const metadata = getSEOTags({
  title: "Terms and Conditions | FeNAgO",
  canonicalUrlRelative: "/tos",
});

export default function TermsAndConditions() {
  // Your page component
  return (
    <div>...</div>
  );
}
```

### Recommended Page-Specific SEO Properties

At minimum, you should customize these properties for each page:

1. **title**: The page title that appears in search results and browser tabs
2. **canonicalUrlRelative**: The relative URL path that should be considered the canonical (primary) version of the page

### Additional SEO Properties

The `getSEOTags()` function accepts several other properties for more detailed customization:

```typescript
getSEOTags({
  title: "Custom Page Title | FeNAgO",
  description: "A custom description for this specific page.",
  canonicalUrlRelative: "/custom-page",
  ogImage: "/images/custom-og-image.jpg", // Relative to /public
  robots: "index, follow",
  structuredData: {}, // Custom structured data object
});
```

## Step 4: Adding Structured Data with Schema.org

Structured data helps search engines understand the content and context of your pages, potentially resulting in rich snippets in search results.

Use the `renderSchemaTags()` function to add structured data to your pages:

```typescript
// In app/page.tsx
import { renderSchemaTags } from "@/libs/seo";

export default function HomePage() {
  return (
    <>
      {renderSchemaTags()}
      
      <main>
        {/* Your page content */}
      </main>
    </>
  );
}
```

### Customizing Structured Data

You can customize the structured data by passing a parameter to the `renderSchemaTags()` function:

```typescript
renderSchemaTags({
  type: "Product",
  name: "FeNAgO Pro Plan",
  description: "Advanced AI-powered tools for your business",
  images: ["https://fenago.com/images/product.jpg"],
  offers: {
    price: 49.99,
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
  },
});
```

Common schema types include:
- `WebSite` (default if no type is specified)
- `Organization`
- `Product`
- `Article`
- `FAQPage`

## Step 5: Generating Sitemap and Robots.txt

FeNAgO uses the `next-sitemap` package to automatically generate a sitemap.xml and robots.txt file during the build process.

1. Open the `next-sitemap.config.js` file in your project root
2. Update the `siteUrl` to match your production domain:

```javascript
// next-sitemap.config.js
module.exports = {
  siteUrl: 'https://fenago.com',
  generateRobotsTxt: true,
  // Additional configuration options...
};
```

3. When you build your application (`npm run build`), the sitemap.xml and robots.txt files will be automatically generated in the `/public` directory

## Step 6: Verifying Ownership with Google Search Console

Verifying your site with Google Search Console is essential for monitoring your site's performance in Google search results and addressing any indexing issues.

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click "Add Property" and enter your website's URL
3. Choose a verification method. The recommended options are:
   - HTML file upload (download the file and place it in your `/public` directory)
   - HTML tag (add this to the `<head>` section in your `app/layout.tsx` file)
   - DNS record (add this through your domain registrar)
4. Follow the verification instructions provided by Google
5. Once verified, submit your sitemap.xml URL to Google Search Console

## Step 7: Setting Up a Blog with SEO Best Practices

FeNAgO includes a blog system that's already optimized for SEO. To set it up:

1. Navigate to the `/app/blog/_assets` folder
2. Open the `content.js` file which contains configurations for blog posts, authors, and categories
3. Update the contents with your own blog posts and information

### Adding a New Blog Post with SEO Optimization

```javascript
// In app/blog/_assets/content.js
export const blogPosts = [
  {
    slug: "getting-started-with-fenago",
    title: "Getting Started with FeNAgO",
    description: "Learn how to set up your FeNAgO project in minutes and start building your SaaS or AI tool.",
    date: "2025-05-01",
    published: true,
    image: "/blog/getting-started.jpg",
    authors: ["john-doe"],
    categories: ["tutorials"],
    content: `
      # Getting Started with FeNAgO
      
      In this guide, we'll walk through the process of setting up your FeNAgO project...
    `,
  },
  // Add more blog posts
];
```

Each blog post automatically generates:
- SEO-optimized title and meta tags
- Open Graph images for social sharing
- Structured data for blog articles
- Proper canonical URLs
- Author information

## Advanced SEO Techniques

### Dynamic OG Images

For more engaging social media previews, consider implementing dynamic Open Graph images:

1. Create a route for generating OG images in `/app/api/og/route.tsx`
2. Use libraries like `@vercel/og` to generate dynamic images
3. Reference these dynamic images in your SEO tags

### SEO Performance Monitoring

Regularly monitor your SEO performance using:

1. Google Search Console (for indexing issues and search performance)
2. Google Analytics (for user behavior and traffic sources)
3. Lighthouse (for overall SEO score and recommendations)

## Troubleshooting Common SEO Issues

### Pages Not Being Indexed

Check for:
- `robots` meta tags that might be blocking crawlers
- Missing or incorrect canonical URLs
- `noindex` directives in your robots.txt

### Duplicate Content Issues

Resolve with:
- Proper canonical URL implementation
- Consistent internal linking
- URL structure optimization

### Poor SEO Performance

Improve by:
- Enhancing page load speed
- Ensuring mobile friendliness
- Adding more relevant, high-quality content
- Improving internal linking structure

## Resources

- [Next.js Metadata API Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google's SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide)
- [Schema.org Documentation](https://schema.org/docs/schemas.html)
- [Google Search Console Help](https://support.google.com/webmasters/)

---

By following this guide, you'll have implemented a comprehensive SEO strategy for your FeNAgO application, ensuring better visibility, enhanced user experience, and improved discoverability across search engines.

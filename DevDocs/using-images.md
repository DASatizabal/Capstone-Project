# Using Images in Your Application

## Finding Free Images on Unsplash

Unsplash offers high-quality, free-to-use images that you can incorporate into your application. Here's how to find and use them:

1. Go to [Unsplash.com](https://unsplash.com/)
2. Use the search bar to find images related to your needs (e.g., "business", "technology", "nature")
3. Browse through the results until you find an image you like
4. Right-click on the image and select "Copy Image Address" or "Copy Image Link"
5. Use this URL in your application's image components

## Example: Replacing an Image in Hero.tsx

In the `Hero.tsx` component, you can find an Image component like this:

```tsx
<Image
  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=2072&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  alt="Product Demo"
  className="w-full"
  priority={true}
  width={500}
  height={500}
/>
```

To replace this image:

1. Copy the URL of your chosen Unsplash image
2. Replace the `src` value in the Image component with your new URL
3. Update the `alt` text to describe your new image

## Optimizing Downloaded Images

If you prefer to download images and host them locally in your project:

1. Download the image from Unsplash (click on the image and then the download button)
2. Go to [ImageResizer.com](https://imageresizer.com) or another image compression tool
3. Upload your image to the compression tool
4. Adjust settings as needed for quality and file size
5. Download the compressed image
6. Add the image to your project's public folder (e.g., `public/images/`)
7. Update your Image component to reference the local file:

```tsx
<Image
  src="/images/your-compressed-image.jpg"
  alt="Your Image Description"
  className="w-full"
  priority={true}
  width={500}
  height={500}
/>
```

## Best Practices

- Always provide accurate `alt` text for accessibility
- Specify width and height to prevent layout shifts
- Use appropriate image formats (JPG for photos, PNG for graphics with transparency, WebP for better compression)
- Consider using the `priority` prop for above-the-fold images
- Optimize image dimensions to be appropriate for their display size

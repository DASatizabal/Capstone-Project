# Setting Up Analytics With DataFast

## Introduction

Analytics are essential for understanding user behavior, tracking conversions, and optimizing your application. This guide will walk you through setting up DataFast analytics for your FeNAgO application, enabling you to track page views, custom events, and marketing channel performance.

## Prerequisites

- A Next.js application (FeNAgO)
- Access to create a DataFast account

## Step 1: Create a DataFast Account

1. Visit [DataFast's website](https://datafast.io/) and sign up for an account
2. Complete the registration process with your email and password
3. Verify your email address if required

## Step 2: Add a New Website in DataFast

1. After logging in to your DataFast dashboard, click on **Add New Website** or similar option
2. Enter your website information:
   - Website name (e.g., "FeNAgO")
   - Website URL (e.g., "https://fenago.com")
   - Industry category
3. Click **Create** to add your website to DataFast

## Step 3: Get Your Tracking Script

1. In your DataFast dashboard, select your newly created website
2. Navigate to **Settings** or **Tracking Code** section
3. Locate the JavaScript tracking snippet provided by DataFast
4. Copy the entire tracking script, which should look something like this:

```javascript
<!-- DataFast Analytics -->
<script>
  (function(d,a,t,f) {
    var s = d.createElement('script');
    s.async = true;
    s.src = 'https://cdn.datafast.io/tracker.js';
    s.onload = function() {
      window.datafast = window.datafast || [];
      window.datafast.init({ siteId: 'YOUR_SITE_ID' });
    };
    var e = d.getElementsByTagName('script')[0];
    e.parentNode.insertBefore(s, e);
  })(document, window, 'datafast', 'init');
</script>
<!-- End DataFast Analytics -->
```

## Step 4: Add the Tracking Script to Your Next.js Layout

There are two approaches to adding the tracking script to your Next.js application, depending on your version and preferences:

### Option 1: Using Script Component (Recommended for Next.js 13+)

1. Open your main layout file at `app/layout.tsx`
2. Import the Script component from Next.js:

```tsx
import Script from 'next/script';
```

3. Add the DataFast script within your layout component, just before the closing `</body>` tag:

```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        
        <Script
          id="datafast-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(d,a,t,f) {
                var s = d.createElement('script');
                s.async = true;
                s.src = 'https://cdn.datafast.io/tracker.js';
                s.onload = function() {
                  window.datafast = window.datafast || [];
                  window.datafast.init({ siteId: 'YOUR_SITE_ID' });
                };
                var e = d.getElementsByTagName('script')[0];
                e.parentNode.insertBefore(s, e);
              })(document, window, 'datafast', 'init');
            `,
          }}
        />
      </body>
    </html>
  );
}
```

### Option 2: Using Custom Document (For Pages Router)

If you're using the Pages Router instead of the App Router, you can add the script to your custom `_document.js` file:

1. Create or open `pages/_document.js`
2. Add the DataFast script to the `<Head>` or just before the closing `</body>` tag:

```jsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head />
      <body>
        <Main />
        <NextScript />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(d,a,t,f) {
                var s = d.createElement('script');
                s.async = true;
                s.src = 'https://cdn.datafast.io/tracker.js';
                s.onload = function() {
                  window.datafast = window.datafast || [];
                  window.datafast.init({ siteId: 'YOUR_SITE_ID' });
                };
                var e = d.getElementsByTagName('script')[0];
                e.parentNode.insertBefore(s, e);
              })(document, window, 'datafast', 'init');
            `,
          }}
        />
      </body>
    </Html>
  );
}
```

## Step 5: Replace 'YOUR_SITE_ID' with Your Actual Site ID

1. In the tracking script you added, replace `'YOUR_SITE_ID'` with the actual site ID provided by DataFast
2. This ID is unique to your website and is required for DataFast to associate the tracking data with your account

## Step 6: Add the DataFast Site ID to Your Environment Variables (Optional but Recommended)

For better security and configuration management, consider storing your DataFast Site ID in your environment variables:

1. Add the Site ID to your `.env` file:

```
DATAFAST_SITE_ID=your_site_id_here
```

2. Modify the tracking script to use the environment variable:

```tsx
<Script
  id="datafast-analytics"
  strategy="afterInteractive"
  dangerouslySetInnerHTML={{
    __html: `
      (function(d,a,t,f) {
        var s = d.createElement('script');
        s.async = true;
        s.src = 'https://cdn.datafast.io/tracker.js';
        s.onload = function() {
          window.datafast = window.datafast || [];
          window.datafast.init({ siteId: '${process.env.NEXT_PUBLIC_DATAFAST_SITE_ID}' });
        };
        var e = d.getElementsByTagName('script')[0];
        e.parentNode.insertBefore(s, e);
      })(document, window, 'datafast', 'init');
    `,
  }}
/>
```

Note: You need to use `NEXT_PUBLIC_` prefix for environment variables that should be available in the browser.

## Step 7: Test Analytics Installation

1. Deploy your application or run it locally
2. Visit your website and perform some actions
3. Return to your DataFast dashboard to verify that data is being collected
4. You should see page views, session data, and other metrics starting to populate

## Step 8: Track Custom Events (Optional)

To gain more insights about specific user interactions, you can track custom events:

1. Add the following code where you want to track a custom event:

```javascript
// Track a simple event
window.datafast.track('button_click');

// Track an event with properties
window.datafast.track('completed_purchase', {
  product: 'Premium Subscription',
  value: 49.99,
  currency: 'USD'
});
```

2. Create a utility function for easier event tracking throughout your application:

```typescript
// utils/analytics.ts
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.datafast) {
    window.datafast.track(eventName, properties);
  }
};
```

3. Use this utility function in your components:

```tsx
import { trackEvent } from '@/utils/analytics';

export default function SubscribeButton() {
  const handleSubscribe = () => {
    // Your subscription logic
    
    // Track the event
    trackEvent('subscription_initiated', { plan: 'premium' });
  };

  return <button onClick={handleSubscribe}>Subscribe</button>;
};
```

## Step 9: Set Up Marketing Channel Tracking

DataFast automatically tracks various marketing channels to help you understand where your traffic is coming from. To enhance this tracking:

1. Ensure UTM parameters are added to your marketing campaign URLs:
   - `utm_source`: The referrer (e.g., google, newsletter)
   - `utm_medium`: Marketing medium (e.g., cpc, email)
   - `utm_campaign`: Campaign name (e.g., spring_sale)
   - `utm_content`: Content identifier (e.g., logo_link, text_link)
   - `utm_term`: Search terms (for paid search campaigns)

2. Example campaign URL:
   ```
   https://fenago.com/pricing?utm_source=google&utm_medium=cpc&utm_campaign=spring_sale
   ```

3. DataFast will automatically detect and track these parameters, associating conversions with the appropriate marketing channels

## Best Practices

1. **Respect User Privacy**:
   - Update your privacy policy to disclose your use of analytics
   - Consider adding cookie consent if required by regulations like GDPR

2. **Filter Internal Traffic**:
   - Set up IP filters in DataFast to exclude your team's traffic from analytics

3. **Set Up Goals and Conversions**:
   - Define key conversion events in your DataFast dashboard
   - Track progress toward business objectives

4. **Regularly Review Data**:
   - Schedule time to review analytics insights
   - Use the data to inform product decisions and marketing strategies

## Troubleshooting

### Analytics Not Tracking

- Verify the script is properly installed in your layout
- Check for JavaScript errors in the browser console
- Ensure your DataFast site ID is correct
- Temporarily disable ad blockers or privacy extensions which might interfere

### Missing Custom Events

- Ensure the DataFast script loads before tracking events
- Verify that custom events are being called with the correct syntax
- Check if you're accessing the global `window.datafast` object correctly

## Resources

- [DataFast Documentation](https://datafast.io/docs)
- [Next.js Script Component](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
- [UTM Parameter Guide](https://support.google.com/analytics/answer/1033863)

---

With DataFast analytics properly set up, you'll be able to track user behavior, understand which marketing channels perform best, and make data-driven decisions to improve your FeNAgO application.

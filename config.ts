import themes from "daisyui/src/theming/themes";

import { ConfigProps } from "./types/config";

const config = {
  // REQUIRED
  appName: "ChoreMinder",
  // REQUIRED: a short description of your app for SEO tags (can be overwritten)
  appDescription:
    "Tired of the chore wars? Let ChoreMinder keep score and keep the peace.",
  // REQUIRED (no https://, not trailing slash at the end, just the naked domain)
  domainName: "ChoreMinder.ai",
  crisp: {
    // Crisp website ID. IF YOU DON'T USE CRISP: just remove this => Then add a support email in this config file (resend.supportEmail) otherwise customer support won't work.
    id: "",
    // Hide Crisp by default, except on route "/". Crisp is toggled with <ButtonSupport/>. If you want to show Crisp on every routes, just remove this below
    onlyShowOnRoutes: ["/"],
  },
  stripe: {
    // Create multiple plans in your Stripe dashboard, then add them here. You can add as many plans as you want, just make sure to add the priceId
    plans: [
      {
        // REQUIRED — we use this to find the plan in the webhook (for instance if you want to update the user's credits based on the plan)
        priceId:
          process.env.NODE_ENV === "development"
            ? "prod_SjLRGJOWMe0gYq"
            : "price_1RnskTRojmUDLEIpouTer7CY",
        //  REQUIRED - Name of the plan, displayed on the pricing page
        name: "Starter Plan",
        // A friendly description of the plan, displayed on the pricing page. Tip: explain why this plan and not others
        description: "Perfect for small families or attentive kids.",
        // The price you want to display, the one user will be charged on Stripe.
        price: 4.99,
        // If you have an anchor price (i.e. $29) that you want to display crossed out, put it here. Otherwise, leave it empty
        priceAnchor: 7.49,
        features: [
          {
            name: "20 Monthly Messages",
          },
          { name: "Add up to 2 kids." },
          { name: "Give them up to 3 Chores" },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "prod_SjLSHtOG47gTv2"
            : "price_1RnslmRojmUDLEIpRrJnf2w1",
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: true,
        name: "Mid Plan",
        description: "For bigger households and distracted kids.",
        price: 7.99,
        priceAnchor: 11.99,
        features: [
          {
            name: "30 Monthly Messages",
          },
          { name: "Add up to 5 kids." },
          { name: "Give them up to 10 Chores." },
          { name: "Help them with AI Instructions." },
          { name: "Set reocurring schedules." },
          { name: "Set rewards." },
        ],
      },
      {
        priceId:
          process.env.NODE_ENV === "development"
            ? "prod_SjLSHtOG47gTv2"
            : "price_1RnslmRojmUDLEIpRrJnf2w1",
        // This plan will look different on the pricing page, it will be highlighted. You can only have one plan with isFeatured: true
        isFeatured: false,
        name: "The Nanny",
        description:
          "For busy parents, outgunned and outnumbered by messy children. Use only when all hope is lost.",
        price: 12.99,
        priceAnchor: 19.99,
        features: [
          {
            name: "Unlimited messages",
          },
          { name: "Add up to 10 kids." },
          { name: "Give them ALL the Chores." },
          { name: "Help them with AI Instructions." },
          { name: "Set reocurring schedules." },
          { name: "Set rewards." },
          { name: "Online Support." },
          { name: "24/7 AI Child psychiatric assistance." },
          { name: "Daily tips on how to manage your busy household." },
        ],
      },
    ],
  },
  aws: {
    // If you use AWS S3/Cloudfront, put values in here
    bucket: "bucket-name",
    bucketUrl: `https://bucket-name.s3.amazonaws.com/`,
    cdn: "https://cdn-id.cloudfront.net/",
  },
  resend: {
    // REQUIRED — Email 'From' field to be used when sending magic login links
    fromNoReply: `ChildMinder <noreply@resend.ChildMinder.ai>`,
    // REQUIRED — Email 'From' field to be used when sending other emails, like abandoned carts, updates etc..
    fromAdmin: `Parent Helper at ChildMinder <PHelper@resend.ChildMinder.ai>`,
    // Email shown to customer if they need support. Leave empty if not needed => if empty, set up Crisp above, otherwise you won't be able to offer customer support."
    supportEmail: "support@ChildMinder.ai",
  },
  colors: {
    // REQUIRED — The DaisyUI theme to use (added to the main layout.js). Leave blank for default (light & dark mode). If you use any theme other than light/dark, you need to add it in config.tailwind.js in daisyui.themes.
    theme: "light",
    // REQUIRED — This color will be reflected on the whole app outside of the document (loading bar, Chrome tabs, etc..). By default it takes the primary color from your DaisyUI theme (make sure to update your the theme name after "data-theme=")
    // OR you can just do this to use a custom color: main: "#f37055". HEX only.
    main: themes["light"]["primary"],
  },
  auth: {
    // REQUIRED — the path to log in users. It's use to protect private routes (like /dashboard). It's used in apiClient (/libs/api.js) upon 401 errors from our API
    loginUrl: "/api/auth/signin",
    // REQUIRED — the path you want to redirect users to after a successful login (i.e. /dashboard, /private). This is normally a private page for users to manage their accounts. It's used in apiClient (/libs/api.js) upon 401 errors from our API & in ButtonSignin.js
    callbackUrl: "/dashboard",
  },
} as ConfigProps;

export default config;

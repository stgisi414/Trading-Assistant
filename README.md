
# Signatex - AI-Powered Trading Assistant

## Environment Variables Required

Add these to your Replit Secrets:

### Core API Keys
- `API_KEY` - Your Google Gemini API key
- `FMP_API_KEY` - Financial Modeling Prep API key

### News Search
- `GOOGLE_CUSTOM_SEARCH_API_KEY` - Google Custom Search API key
- `NEWS_CUSTOM_SEARCH_CX` - Custom Search Engine ID for news

### Image Search (New)
- `IMAGE_CUSTOM_SEARCH_CX` - Custom Search Engine ID for images
- Note: Uses the same `GOOGLE_CUSTOM_SEARCH_API_KEY` as news search

## Image Search Features

The application now includes:
1. **Google Custom Search for Images** - Searches for company logos and financial illustrations
2. **Imagen3 Backup Generation** - AI-generated images when Google search returns no results
3. **Symbol Logo Search** - Finds company logos and branding images
4. **Reasoning Illustrations** - Visual aids to support analysis explanations

## Setup Instructions

1. Set up your Google Custom Search Engine for images at console.cloud.google.com
2. Configure it to search the entire web for images
3. Add the `IMAGE_CUSTOM_SEARCH_CX` to your Replit Secrets
4. The same `GOOGLE_CUSTOM_SEARCH_API_KEY` will be used for both news and image searches


# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

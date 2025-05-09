# Setup Guide

## Environment Variables

This project requires several environment variables to function properly. Create a `.env.local` file in the root directory with the following variables:

```
# API Keys
CONVERT_API_SECRET=your_convertapi_secret_key
OPENAI_API_KEY=your_openai_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### ConvertAPI Secret Key
1. Sign up or log in to [ConvertAPI](https://www.convertapi.com/)
2. Go to your dashboard to find your Secret key
3. Add it to your `.env.local` file

### OpenAI API Key
1. Create an account on [OpenAI](https://platform.openai.com/)
2. Navigate to the API section and create a new API key
3. Add it to your `.env.local` file

### Cloudinary Configuration
1. Sign up for a [Cloudinary](https://cloudinary.com/) account
2. Go to your dashboard to find your cloud name, API key, and API secret
3. Add them to your `.env.local` file

## Development

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm run dev
```

## Important Security Note
Never commit your API keys to git. The `.env.local` file is already in `.gitignore` to prevent accidental commits. 
# Draft My Game

A powerful brainstorming tool for indie game developers built with Next.js, React Flow, and Google's Generative AI.

## Overview

This application helps game developers generate, visualize, and expand on creative ideas for indie game development. It utilizes AI to generate relevant topics based on your input and displays them in an interactive, visual flow diagram that can be manipulated, expanded, and exported.

## Features

- **AI-Powered Idea Generation**: Enter a game concept or design challenge to instantly generate relevant creative topics
- **Interactive Visual Mapping**: Visualize ideas as an expandable mind map with drag-and-drop capabilities
- **Topic Expansion**: Drill down on any idea node to explore it further with AI-generated sub-topics
- **Download Game Design Documents**: Easily download a game design document based upon your topics

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Visualization**: React Flow (@xyflow/react)
- **AI Integration**: Google Generative AI API
- **Analytics**: Vercel Analytics

## Getting Started

First, set up your environment variables:
1. Create a `.env.local` file in the root directory
2. Add your Google Generative AI API key: `GOOGLE_API_KEY=your_api_key_here`

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How to Use

1. Enter a game design concept or challenge in the command palette
2. Review the generated topic nodes in the flow canvas
3. Drag nodes to rearrange them
4. Use node toolbar options to expand topics, edit text, or perform other actions
5. Toggle between dark and light mode using the theme switcher

## Learn More

This project leverages Next.js. To learn more about Next.js, check out these resources:

- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## Deployment

The app can be easily deployed using [Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

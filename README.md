# AI Chat Docs - Document Compilation Assistant

A modern, production-ready React application that helps users compile multiple files into a single markdown document using Google Gemini AI. Built with React 18, TypeScript, Vite, and TailwindCSS.

## 🚀 Features

### Core Functionality

- **AI-Powered Document Compilation**: Use Google Gemini to intelligently merge multiple files into a single, well-structured markdown document
- **Multi-Format File Support**: Upload and process various file types including:
  - Markdown (`.md`, `.mdx`)
  - Text files (`.txt`)
  - Code files (`.js`, `.ts`, `.jsx`, `.tsx`, `.py`, `.java`, `.cpp`, `.css`, `.html`, `.json`, `.yaml`, etc.)
  - Documents (`.doc`, `.docx`)
  - HTML files

### File Management

- **Drag & Drop Upload**: Intuitive file upload with visual feedback
- **Folder Upload**: Upload entire folders and automatically scan for supported files
- **Text Paste**: Directly paste text content into the application
- **URL Scraping**: Extract content from web pages (CORS restrictions may apply)
- **File Preview**: View and edit uploaded files with syntax highlighting
- **File Thumbnails**: Quick preview of file contents

### AI Integration

- **Google Gemini API**: Integrated with multiple Gemini models
- **Model Selection**: Choose between different Gemini models based on your needs
- **Content Condensing**: Optimize generated documents for use as LLM context
- **Interactive Chat**: Communicate with AI to refine and customize document generation

### User Experience

- **Mobile-First Design**: Optimized for iPhone, Chrome, Safari, and Brave browsers
- **Responsive Layout**: Seamless experience across all screen sizes
- **Dark/Light Mode**: System-aware theme with manual toggle
- **Modern UI**: Clean, professional interface with smooth animations
- **Real-time Feedback**: Live upload progress and processing indicators

### Data Management

- **Local Storage**: Persistent settings and API key storage
- **Session Management**: Temporary storage for files and chat history
- **Export/Import**: Backup and restore application settings
- **Download Options**: Save generated documents as markdown files

## 🛠 Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: TailwindCSS with custom design system
- **UI Components**: Radix UI primitives with custom styling
- **State Management**: React hooks with local storage persistence
- **API Integration**: Google Generative AI SDK
- **File Processing**: Custom utilities for multiple file formats
- **Routing**: React Router 6
- **Icons**: Lucide React
- **Notifications**: Sonner for toast messages

## 🏗 Project Structure

```
src/
├── components/
│   ├── chat/              # Chat interface components
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   └── GeneratedContent.tsx
│   ├── file-handler/      # File management components
│   │   ├── FileUploader.tsx
│   │   ├── FileList.tsx
│   │   └── FilePreview.tsx
│   ├── settings/          # Settings and configuration
│   │   └── SettingsPanel.tsx
│   ├── url-scraper/       # URL scraping functionality
│   │   └── URLScraper.tsx
│   └── ui/                # Reusable UI components
├── hooks/                 # Custom React hooks
│   ├── useGemini.ts
│   ├── useFileHandler.ts
│   └── useSettings.ts
├── lib/                   # Utility libraries
│   ├── gemini.ts          # AI service integration
│   ├── file-utils.ts      # File processing utilities
│   ├── storage.ts         # Local storage management
│   └── utils.ts           # General utilities
├── types/                 # TypeScript type definitions
│   └── index.ts
└── pages/                 # Route components
    ├── Index.tsx
    └── NotFound.tsx
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm, yarn, or pnpm
- Google Gemini API key

### Installation

1. **Clone and install dependencies**:

   ```bash
   npm install
   ```

2. **Start the development server**:

   ```bash
   npm run dev
   ```

3. **Open your browser** to `http://localhost:8080`

### Configuration

1. **Get a Gemini API Key**:

   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the key

2. **Configure the Application**:
   - Click the Settings button in the app
   - Paste your API key
   - Click "Test & Save"
   - Select your preferred model

## 📱 Usage Guide

### Basic Workflow

1. **Initial Setup**:

   - Open the app and configure your Gemini API key
   - The AI will ask for your document name and expected file count

2. **Upload Files**:

   - Drag and drop files into the upload area
   - Use the "Upload Files" or "Upload Folder" buttons
   - Paste text content directly
   - Add URLs to scrape web content

3. **Review and Edit**:

   - Click on any file to expand and view its content
   - Edit files directly in the interface
   - Remove unwanted files using the delete button

4. **Generate Document**:
   - Once all files are uploaded, click "Generate Document"
   - The AI will create a structured markdown document
   - Choose to download, copy, or condense the result

### Advanced Features

- **Content Condensing**: Use the "Condense" button to create LLM-optimized versions
- **Format Toggle**: Switch between markdown and raw text views
- **Theme Switching**: Toggle between light, dark, and system themes
- **Folder Scanning**: Upload entire directories and preview found files

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run typecheck` - Run TypeScript type checking
- `npm test` - Run tests
- `npm run format.fix` - Format code with Prettier

### Key Features for Developers

- **Type Safety**: Full TypeScript coverage with strict mode
- **Modern React**: Uses React 18 features and patterns
- **Performance**: Optimized builds with code splitting
- **Accessibility**: ARIA compliant with keyboard navigation
- **Mobile Optimized**: Touch-friendly interface with proper viewport handling

## 🔒 Security & Privacy

- **Local Storage**: All settings and API keys are stored locally
- **No Data Transmission**: Files are processed client-side before sending to AI
- **API Key Protection**: Keys are stored securely and never logged
- **CORS Awareness**: URL scraping respects cross-origin restrictions

## 🐛 Troubleshooting

### Common Issues

1. **API Key Issues**:

   - Ensure your Gemini API key is valid
   - Check that billing is enabled in Google Cloud Console
   - Verify the key has proper permissions

2. **File Upload Problems**:

   - Check file size limits (10MB per file, 50 files total)
   - Ensure file types are supported
   - Try uploading files individually if bulk upload fails

3. **URL Scraping Failures**:
   - CORS restrictions may prevent access to some sites
   - Try the URL in a CORS proxy or use copy/paste instead

### Performance Optimization

- Clear browser cache if experiencing slow loading
- Reduce the number of large files to improve processing speed
- Use the "Condense" feature for large documents

## 📄 License

This project is built with modern web technologies and follows best practices for production applications.

## 🤝 Contributing

This is a production-ready template that can be customized and extended for specific needs. The modular architecture makes it easy to add new features or modify existing functionality.

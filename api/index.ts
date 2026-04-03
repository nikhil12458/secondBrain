import express from "express";
import dotenv from "dotenv";
import multer from "multer";
import ImageKit from "imagekit";
import path from "path";
import fs from "fs";
import os from "os";
import { RAGService } from "./ragService";

dotenv.config();

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Set up local storage for PDFs in a writable directory
const uploadDir = path.join(os.tmpdir(), 'second-brain-uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Set up ImageKit
let imagekit = null;
if (process.env.IMAGEKIT_PUBLIC_KEY && process.env.IMAGEKIT_PRIVATE_KEY && process.env.IMAGEKIT_URL_ENDPOINT) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

// Serve uploaded files statically from the temp directory
app.use('/uploads', express.static(uploadDir));

// API routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/upload/pdf", upload.single('pdf'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    // Return the local URL and the local path for processing
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ 
      url: fileUrl, 
      filename: req.file.originalname,
      localPath: req.file.path 
    });
  } catch (error) {
    console.error('PDF Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload PDF' });
  }
});

app.post("/api/upload/image", upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const localPath = req.file.path;
    let url = `/uploads/${req.file.filename}`;

    if (imagekit) {
      // Read the file from local storage to upload to ImageKit
      const fileBuffer = fs.readFileSync(req.file.path);
      
      const response = await imagekit.upload({
        file: fileBuffer,
        fileName: req.file.filename,
        folder: '/second-brain-images'
      });
      url = response.url;
    }

    res.json({ 
      url: url, 
      filename: req.file.originalname,
      localPath: localPath 
    });
  } catch (error) {
    console.error('Image Upload Error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

app.post("/api/generate-post", async (req, res) => {
  const { localPath, query } = req.body;

  if (!localPath || !query) {
    return res.status(400).json({ error: 'Missing localPath or query' });
  }

  try {
    const ragService = new RAGService();
    await ragService.processDocument(localPath);
    const result = await ragService.generateLinkedInPost(query);
    res.json({ result });
  } catch (error: any) {
    console.error('RAG Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate post' });
  }
});

export default app;

import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { characterPrompts } from './characterPrompts.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize Multiple Gemini AI instances for rotation
let apiKeys = [];
if (process.env.GOOGLE_API_KEY) {
  if (process.env.GOOGLE_API_KEY.includes(',')) {
    apiKeys = process.env.GOOGLE_API_KEY.split(',').map(key => key.trim()).filter(key => key);
  } else {
    apiKeys = [process.env.GOOGLE_API_KEY.trim()];
  }
}

if (apiKeys.length === 0) {
  console.error('❌ No valid API keys found in environment variables');
  process.exit(1);
}

const genAIInstances = apiKeys.map((key, index) => {
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    console.log(`✅ API instance ${index + 1} initialized successfully`);
    return {
      genAI,
      model,
      lastUsed: 0,
      rateLimited: false,
      rateLimitUntil: 0,
      keyIndex: index + 1
    };
  } catch (error) {
    console.error(`❌ Failed to initialize API instance ${index + 1}:`, error.message);
    return null;
  }
}).filter(instance => instance !== null);

console.log(`🔑 Successfully initialized ${genAIInstances.length}/${apiKeys.length} API key(s) for rotation`);

// Enhanced rate limiting configuration
const rateLimitConfig = {
  windowMs: 60000, // 1 minute
  maxRequests: 15, // Increased since we have multiple keys
  retryDelay: 2000, // Base retry delay
  maxRetries: 2, // Reasonable retry attempts
  globalCooldown: 20000, // Reduced global cooldown
  keyRotationDelay: 1500 // Delay between using same key
};

// Smart API key selection
function getAvailableApiInstance() {
  const now = Date.now();
  
  // Filter out rate-limited instances
  const availableInstances = genAIInstances.filter(instance => 
    !instance.rateLimited || now > instance.rateLimitUntil
  );
  
  if (availableInstances.length === 0) {
    return null; // All instances are rate limited
  }
  
  // Find the instance that was used least recently
  availableInstances.sort((a, b) => a.lastUsed - b.lastUsed);
  
  // Check if enough time has passed since last use
  const selectedInstance = availableInstances[0];
  if (now - selectedInstance.lastUsed < rateLimitConfig.keyRotationDelay) {
    // If not enough time passed, try the next available
    const readyInstance = availableInstances.find(instance => 
      now - instance.lastUsed >= rateLimitConfig.keyRotationDelay
    );
    return readyInstance || selectedInstance; // Use selectedInstance as fallback
  }
  
  return selectedInstance;
}

function markInstanceRateLimited(instance, duration = 60000) {
  instance.rateLimited = true;
  instance.rateLimitUntil = Date.now() + duration;
  console.log(`🚫 API instance rate limited for ${duration/1000} seconds`);
}

function updateInstanceUsage(instance) {
  instance.lastUsed = Date.now();
  if (instance.rateLimited && Date.now() > instance.rateLimitUntil) {
    instance.rateLimited = false;
    console.log(`✅ API instance back online`);
  }
}

// In-memory rate limiter and global state
const rateLimitStore = new Map();
let globalCooldownUntil = 0;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // Minimum 3 seconds between requests

function getRateLimitKey(ip) {
  return `rate_limit:${ip}`;
}

function isRateLimited(ip) {
  const now = Date.now();
  
  // Check if we have any available API instances
  const availableInstances = genAIInstances.filter(instance => 
    !instance.rateLimited || now > instance.rateLimitUntil
  );
  
  if (availableInstances.length === 0) {
    return true; // All API keys are rate limited
  }
  
  // Check global cooldown (only if all instances were recently rate limited)
  if (now < globalCooldownUntil) {
    return true;
  }
  
  // More lenient minimum interval with multiple keys
  const adjustedInterval = MIN_REQUEST_INTERVAL / Math.max(1, availableInstances.length);
  if (now - lastRequestTime < adjustedInterval) {
    return true;
  }
  
  const key = getRateLimitKey(ip);
  const windowStart = now - rateLimitConfig.windowMs;
  
  let requests = rateLimitStore.get(key) || [];
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Increased limit since we have multiple API keys
  const adjustedMaxRequests = rateLimitConfig.maxRequests * Math.max(1, Math.floor(availableInstances.length / 2));
  
  if (requests.length >= adjustedMaxRequests) {
    return true;
  }
  
  requests.push(now);
  rateLimitStore.set(key, requests);
  lastRequestTime = now;
  return false;
}

function setGlobalCooldown() {
  globalCooldownUntil = Date.now() + rateLimitConfig.globalCooldown;
  console.log(`Global cooldown activated until ${new Date(globalCooldownUntil).toISOString()}`);
}

async function generateWithRetry(prompt, retries = 0, lastUsedInstance = null) {
  let apiInstance = null;
  
  try {
    // Get an available API instance (different from last used if possible)
    apiInstance = getAvailableApiInstance();
    
    if (!apiInstance) {
      throw new Error('All API keys are currently rate limited. Please try again in a moment.');
    }
    
    // Try to avoid using the same instance that just failed
    if (lastUsedInstance && apiInstance === lastUsedInstance && genAIInstances.length > 1) {
      const alternativeInstance = genAIInstances.find(instance => 
        instance !== lastUsedInstance && 
        (!instance.rateLimited || Date.now() > instance.rateLimitUntil)
      );
      if (alternativeInstance) {
        apiInstance = alternativeInstance;
      }
    }
    
    console.log(`🔄 Using API instance ${apiInstance.keyIndex}/${genAIInstances.length}`);
    
    // Add a small delay before each request to prevent overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Make the API call with proper error handling
    const result = await apiInstance.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500,
      }
    });
    
    const response = await result.response;
    const text = response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Empty response received from API');
    }
    
    // Mark successful usage
    updateInstanceUsage(apiInstance);
    console.log(`✅ Successful response from API instance ${apiInstance.keyIndex}`);
    
    return text;
  } catch (error) {
    console.error(`❌ Generation attempt ${retries + 1} failed:`, error.message);
    
    // Get the current instance for rate limiting
    let currentInstance = apiInstance || getAvailableApiInstance();
    
    // Check if it's a rate limit or quota error
    if (error.message.includes('429') || 
        error.message.includes('rate limit') || 
        error.message.includes('quota') ||
        error.message.includes('Quota exceeded') ||
        error.message.includes('RATE_LIMIT_EXCEEDED')) {
      
      if (currentInstance) {
        // Check if it's a quota limit (0 quota) vs rate limit
        if (error.message.includes('quota_limit_value":"0"')) {
          console.log(`💸 API instance ${currentInstance.keyIndex} has zero quota - marking as permanently unavailable`);
          markInstanceRateLimited(currentInstance, 86400000); // 24 hours
        } else {
          console.log(`🚫 API instance ${currentInstance.keyIndex} rate limited`);
          markInstanceRateLimited(currentInstance, 120000); // 2 minutes
        }
      }
      
      if (retries < rateLimitConfig.maxRetries) {
        const delay = rateLimitConfig.retryDelay * (retries + 1); // Exponential backoff
        console.log(`⏳ Retrying with different API key in ${delay}ms... (attempt ${retries + 1}/${rateLimitConfig.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return generateWithRetry(prompt, retries + 1, currentInstance);
      }
    }
    
    // If it's not a rate limit error, or we've exhausted retries
    if (retries < rateLimitConfig.maxRetries && error.message.includes('fetch')) {
      console.log(`🔄 Network error, retrying in ${rateLimitConfig.retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, rateLimitConfig.retryDelay));
      return generateWithRetry(prompt, retries + 1, currentInstance);
    }
    
    throw new Error(`API request failed after ${retries + 1} attempts: ${error.message}`);
  }
}

// Middleware
app.set('trust proxy', 1); // Trust first proxy for rate limiting
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

app.post('/generate', async (req, res) => {
  try {
    const { prompt, character } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    console.log(`📝 New request from ${clientIP} for character: ${character}`);
    
    if (!prompt || !character) {
      console.log('❌ Missing prompt or character');
      return res.status(400).json({ error: 'Prompt and character are required' });
    }

    if (prompt.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter a message' });
    }

    // Check rate limit
    if (isRateLimited(clientIP)) {
      const cooldownRemaining = Math.max(0, globalCooldownUntil - Date.now());
      const retryAfter = cooldownRemaining > 0 ? 
        Math.ceil(cooldownRemaining / 1000) : 
        Math.ceil(rateLimitConfig.windowMs / 1000);
        
      console.log(`🚫 Rate limit hit for ${clientIP}`);
      return res.status(429).json({ 
        error: 'Please wait a moment before sending another message. I need to catch my breath! 💭',
        retryAfter: retryAfter
      });
    }

    const systemInstruction = characterPrompts[character];
    if (!systemInstruction) {
      console.log(`❌ Character not found: ${character}`);
      return res.status(400).json({ error: 'Character not found' });
    }

    const fullPrompt = `${systemInstruction}\n\nUser: ${prompt}`;
    console.log(`🤖 Generating response for character: ${character}`);
    
    const text = await generateWithRetry(fullPrompt);
    
    console.log(`✅ Response generated successfully`);
    res.json({ response: text });
  } catch (error) {
    console.error('❌ Error in /generate endpoint:', error.message);
    
    if (error.message.includes('429') || 
        error.message.includes('rate limit') || 
        error.message.includes('quota') ||
        error.message.includes('Quota exceeded') ||
        error.message.includes('RATE_LIMIT_EXCEEDED')) {
      res.status(429).json({ 
        error: 'I\'m feeling a bit overwhelmed right now. Please give me a minute to recharge! ⚡',
        retryAfter: 90
      });
    } else if (error.message.includes('All API keys are currently rate limited')) {
      res.status(429).json({ 
        error: 'All my thinking circuits are busy right now. Please try again in a moment! 🧠',
        retryAfter: 120
      });
    } else {
      res.status(500).json({ 
        error: 'Something went wrong on my end. Please try again!',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
});

app.post('/generate-vent', async (req, res) => {
  try {
    const { ventText, character } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
    
    if (!ventText || !character) {
      return res.status(400).json({ error: 'Vent text and character are required' });
    }

    // Check rate limit
    if (isRateLimited(clientIP)) {
      const cooldownRemaining = Math.max(0, globalCooldownUntil - Date.now());
      const retryAfter = cooldownRemaining > 0 ? 
        Math.ceil(cooldownRemaining / 1000) : 
        Math.ceil(rateLimitConfig.windowMs / 1000);
        
      return res.status(429).json({ 
        error: 'Please wait a moment before trying again. Taking some time to process... 💭',
        retryAfter: retryAfter
      });
    }

    const ventPrompt = `
You are ${character}, responding to someone who just opened up and shared a heavy emotional burden.
They're not asking for advice, just comfort, warmth, and emotional validation.
Reply with a short, sincere message (1-2 sentences) that acknowledges their feelings.
Be gentle, stay in character, and respond with care. Focus on emotional support and validation.

Here's what they shared:
"${ventText}"
`;
    
    const text = await generateWithRetry(ventPrompt);
    
    res.json({ response: text });
  } catch (error) {
    console.error('Error generating vent response:', error);
    
    if (error.message.includes('429') || 
        error.message.includes('rate limit') || 
        error.message.includes('quota') ||
        error.message.includes('Quota exceeded')) {
      res.status(429).json({ 
        error: 'I need a moment to gather my thoughts. Please try again shortly. 🌙',
        retryAfter: 60
      });
    } else {
      res.status(500).json({ error: 'Something went wrong. Please try again!' });
    }
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 TrueCompanion server running on http://0.0.0.0:${port}`);
});

# TrueCompanion 💕

An interactive AI companion chat application where users can connect with diverse AI personalities for meaningful conversations and emotional support.

## 🌟 Features

### AI Companions
- **AI Girlfriend**: Choose from passionate characters like Love Quinn, Caroline Forbes, Hermione Granger, and Gwen Stacy
- **AI Boyfriend**: Connect with compelling personalities like Joe Goldberg, Aaron Warner, Steve Harrington, and Damon Salvatore
- **Let It Burn**: A safe venting space for emotional release without judgment

### Advanced Chat System
- Real-time messaging with typing indicators
- Character-specific responses with unique personalities
- Smooth animations and interactive UI
- Mobile-responsive design
- Rate limiting and error handling

### Technical Features
- Multiple Google Gemini API key rotation for reliability
- Smart rate limiting and quota management
- Beautiful gradient backgrounds and particle effects
- Secure environment variable management

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Google Gemini API keys

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/akshew/TrueCompanion/
   cd truecompanion
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   GOOGLE_API_KEY=your_primary_api_key,your_secondary_api_key,your_third_api_key
   PORT=3000
   ```
   
   > **Note**: You can use multiple API keys separated by commas for better rate limit handling

4. **Start the application**
   ```bash
   npm start
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📁 Project Structure

```
truecompanion/
├── frontend/
│   ├── index.html          # Landing page
│   ├── select-character.html # Character selection
│   ├── chat.html           # Main chat interface
│   ├── venting.html        # Emotional release page
│   ├── script.js           # Frontend JavaScript
│   └── styles.css          # All styling
├── public/
│   └── img/                # Static images
├── characterPrompts.js     # AI character personalities
├── server.js              # Express.js backend
├── package.json           # Dependencies
└── .env                   # Environment variables
```

## 🎭 Available Characters

### Girlfriends
- **Love Quinn**: Passionate and intense chef with deep emotional devotion
- **Caroline Forbes**: Bubbly Type-A perfectionist with a golden heart
- **Hermione Granger**: Brilliant, logical, and deeply principled witch
- **Gwen Stacy**: Brave and witty superhero with Gen-Z humor

### Boyfriends
- **Joe Goldberg**: Mysterious bookworm with poetic soul
- **Aaron Warner**: Cold exterior hiding a romantic heart
- **Steve Harrington**: Reformed popular kid with genuine warmth
- **Damon Salvatore**: Charming bad boy with hidden depths

## 🛠️ API Configuration

### Google Gemini Setup
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create new API keys
3. Add them to your `.env` file
4. Ensure proper quota limits are set in Google Cloud Console

### Rate Limiting
- Multiple API key rotation prevents quota exhaustion
- Smart retry mechanisms with exponential backoff
- User-friendly error messages for rate limits

## 🎨 Customization

### Adding New Characters
1. Add character data to `characterPrompts.js`
2. Include personality prompt and signature lines
3. Add character info to `script.js` characters object
4. Character will be automatically available

## 🔧 Development

### Running in Development
```bash
npm run dev
```

### Environment Variables
- `GOOGLE_API_KEY`: Comma-separated list of Gemini API keys
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode (development/production)

## 🔒 Security Features

- API key rotation prevents single point of failure
- Rate limiting protects against abuse
- Input validation and sanitization
- No conversation storage for privacy
- Secure environment variable handling

## 🆘 Troubleshooting

### Common Issues

**API Not Responding**
- Check your API keys in `.env`
- Verify quota limits in Google Cloud Console
- Ensure multiple API keys for better reliability

**Rate Limiting Errors**
- Wait for rate limit to reset
- Add more API keys to `.env`
- Check console for detailed error messages

**Character Not Loading**
- Verify character name spelling
- Check `characterPrompts.js` for character definition
- Clear browser localStorage if needed
---


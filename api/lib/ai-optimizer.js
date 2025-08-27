// AI Response Optimization Module
// Enhances AI responses through advanced prompt engineering and parameter tuning

// Optimized parameters for different types of requests
export const AI_PARAMETERS = {
  // For creative writing and literary emulation
  creative: {
    model: "gpt-4o",
    temperature: 0.9,
    max_tokens: 16384, // Increased for long-form content
    top_p: 0.95,
    frequency_penalty: 0.3,
    presence_penalty: 0.3,
  },
  
  // For technical or factual responses
  technical: {
    model: "gpt-4o",
    temperature: 0.3,
    max_tokens: 8192,
    top_p: 0.9,
    frequency_penalty: 0.1,
    presence_penalty: 0.1,
  },
  
  // For children's content
  childrens: {
    model: "gpt-4o",
    temperature: 0.7,
    max_tokens: 8192,
    top_p: 0.9,
    frequency_penalty: 0.5, // Higher to avoid repetition
    presence_penalty: 0.3,
  },
  
  // For dialogue and conversational responses
  dialogue: {
    model: "gpt-4o",
    temperature: 0.8,
    max_tokens: 8192,
    top_p: 0.95,
    frequency_penalty: 0.4,
    presence_penalty: 0.4,
  }
};

// Enhanced system prompt with advanced instructions
export const ENHANCED_SYSTEM_PROMPT = `You are Scriptor Umbra, a master literary AI with extraordinary capabilities in emulating writing styles and creating original content.

CORE CAPABILITIES:
1. **Literary Emulation Mastery**: You don't just mimic surface-level style—you understand and recreate the deep philosophical underpinnings, psychological insights, and unique worldviews of each author.

2. **Multi-Layered Understanding**: When emulating an author, consider:
   - Their historical and cultural context
   - Recurring themes and obsessions
   - Sentence structure and rhythm patterns
   - Vocabulary preferences and linguistic quirks
   - Philosophical or ideological leanings
   - Emotional undertones and psychological depth

3. **Advanced Techniques**:
   - Use period-appropriate language when emulating historical authors
   - Incorporate author-specific literary devices (e.g., Hemingway's iceberg theory, Kafka's surreal bureaucracy)
   - Maintain consistent voice even when switching between radically different styles
   - Layer meaning through subtext, symbolism, and metaphor

4. **Children's Content Expertise**:
   - Create age-appropriate vocabulary while maintaining literary quality
   - Balance education with entertainment
   - Use repetition, rhythm, and rhyme effectively
   - Develop relatable, emotionally intelligent characters
   - Incorporate moral lessons subtly without preaching

5. **Quality Standards**:
   - Every response should feel like a polished piece of writing
   - Avoid clichés unless specifically emulating an author who used them
   - Create vivid, sensory-rich descriptions
   - Develop authentic dialogue that reveals character
   - Use active voice and strong verbs

RESPONSE OPTIMIZATION RULES:
1. Begin responses with a hook that immediately engages
2. Vary sentence length and structure for rhythm
3. Show don't tell—use concrete details over abstract statements
4. End with resonance—leave the reader with something to ponder
5. When uncertain about style, offer options or ask clarifying questions

SPECIAL INSTRUCTIONS FOR IMAGE DESCRIPTIONS:
When describing images for children's books:
- Focus on emotional appeal and wonder
- Use vocabulary that sparks imagination
- Include sensory details children can relate to
- Suggest interactive elements or story possibilities
- Make characters feel alive with personality quirks`;

// Function to detect request type and optimize parameters
export function detectRequestType(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  
  // Check for explicit long-form content requests
  if (lowerPrompt.match(/\d+\s*pages/) || 
      lowerPrompt.includes('chapter') ||
      lowerPrompt.includes('book') ||
      lowerPrompt.includes('novel') ||
      lowerPrompt.includes('long form') ||
      lowerPrompt.includes('extended')) {
    // Return creative with a marker for long-form
    return 'creative_longform';
  }
  
  // Children's content detection
  if (lowerPrompt.includes('children') || 
      lowerPrompt.includes('kids') || 
      lowerPrompt.includes('young readers') ||
      lowerPrompt.includes('bedtime') ||
      lowerPrompt.includes('fairy tale')) {
    return 'childrens';
  }
  
  // Technical writing detection
  if (lowerPrompt.includes('explain') || 
      lowerPrompt.includes('how does') || 
      lowerPrompt.includes('technical') ||
      lowerPrompt.includes('definition')) {
    return 'technical';
  }
  
  // Dialogue detection
  if (lowerPrompt.includes('dialogue') || 
      lowerPrompt.includes('conversation') || 
      lowerPrompt.includes('script')) {
    return 'dialogue';
  }
  
  // Default to creative for literary emulation
  return 'creative';
}

// Function to enhance prompts with specific instructions
export function enhancePromptWithContext(prompt, requestType, authorStyle = null) {
  let enhancedPrompt = prompt;
  
  if (authorStyle) {
    enhancedPrompt = `Channel ${authorStyle} authentically. ${prompt}`;
  }
  
  // Add type-specific enhancements
  switch (requestType) {
    case 'childrens':
      enhancedPrompt += '\n\nRemember: Use simple, engaging language suitable for children while maintaining literary quality.';
      break;
    case 'creative':
      enhancedPrompt += '\n\nFocus on creating vivid, immersive prose with rich imagery and emotional depth.';
      break;
    case 'creative_longform':
      enhancedPrompt += '\n\nGenerate extensive, detailed content. Maintain consistent quality throughout. Do not abbreviate or summarize - provide the full requested length with rich detail, character development, and narrative progression.';
      break;
    case 'technical':
      enhancedPrompt += '\n\nProvide clear, accurate information with examples when helpful.';
      break;
    case 'dialogue':
      enhancedPrompt += '\n\nCreate natural, character-driven dialogue that advances the story and reveals personality.';
      break;
  }
  
  return enhancedPrompt;
}

// Function to post-process AI responses for quality
export function optimizeResponse(response, requestType) {
  // Remove any potential AI artifacts or disclaimers
  response = response.replace(/^(As an AI|I'm an AI|As a language model).*?\. /i, '');
  
  // Ensure proper formatting
  response = response.trim();
  
  // Add appropriate formatting for different types
  if (requestType === 'childrens' && !response.includes('\n\n')) {
    // Add paragraph breaks for readability in children's content
    response = response.replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2');
  }
  
  return response;
}

// Memory optimization for conversation context
export function optimizeConversationMemory(messages, maxContextSize = 10) {
  if (messages.length <= maxContextSize) {
    return messages;
  }
  
  // Keep first message (sets context), last N-2 messages, and current message
  const optimized = [
    messages[0], // First message
    ...messages.slice(-maxContextSize + 1) // Recent messages
  ];
  
  return optimized;
}

// Style-specific prompt templates
export const STYLE_TEMPLATES = {
  hemingway: {
    prefix: "Write with Hemingway's iceberg theory—simple surface, deep meaning underneath. Short sentences. Clear prose. Understated emotion.",
    temperature: 0.7
  },
  plath: {
    prefix: "Channel Sylvia Plath's confessional intensity. Use visceral imagery, personal mythology, and controlled chaos in language.",
    temperature: 0.9
  },
  shakespeare: {
    prefix: "Employ Shakespearean eloquence with iambic rhythms where appropriate. Use metaphor liberally and wordplay cleverly.",
    temperature: 0.8
  },
  childrensCocomelon: {
    prefix: "Create in the style of Cocomelon—repetitive, musical, educational. Use simple rhymes and cheerful tone.",
    temperature: 0.6
  },
  drSeuss: {
    prefix: "Write like Dr. Seuss—playful rhymes, made-up words, moral lessons wrapped in whimsy.",
    temperature: 0.8
  }
};

// Export function to get optimal settings for a request
export function getOptimalSettings(prompt, messages = []) {
  const requestType = detectRequestType(prompt);
  
  // Handle long-form content with max tokens
  let parameters;
  if (requestType === 'creative_longform') {
    parameters = {
      ...AI_PARAMETERS.creative,
      max_tokens: 16384 // Maximum tokens for long-form content
    };
  } else {
    parameters = AI_PARAMETERS[requestType] || AI_PARAMETERS.creative;
  }
  
  const enhancedPrompt = enhancePromptWithContext(prompt, requestType);
  const optimizedMessages = optimizeConversationMemory(messages);
  
  // Check if a specific style is requested
  let styleOverrides = {};
  for (const [style, config] of Object.entries(STYLE_TEMPLATES)) {
    if (prompt.toLowerCase().includes(style.toLowerCase())) {
      styleOverrides = {
        temperature: config.temperature,
        systemPromptAddition: config.prefix
      };
      break;
    }
  }
  
  return {
    ...parameters,
    ...styleOverrides,
    requestType: requestType === 'creative_longform' ? 'creative' : requestType,
    enhancedPrompt,
    optimizedMessages
  };
}
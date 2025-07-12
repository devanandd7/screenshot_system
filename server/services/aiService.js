const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  async analyzeImage(imageUrl) {
    try {
      // Download the image as a buffer
      const response = await fetch(imageUrl);
      const buffer = await response.arrayBuffer();
      const imageBase64 = Buffer.from(buffer).toString('base64');

      // Prepare the prompt
      const prompt = `Analyze this image and provide:\n1. A detailed description (max 200 words)\n2. A single category that best describes the main subject\n3. A confidence score (0-1)\n\nFormat your response as JSON with keys: description, category, confidence`;

      // Use Gemini Flash model
      const model = this.gemini.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent([
        { text: prompt },
        { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
      ]);

      const content = result.response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error('No response content from Gemini');
      }

      // Try to parse JSON response
      let analysis;
      try {
        analysis = JSON.parse(content);
      } catch (parseError) {
        analysis = this.parseTextResponse(content);
      }

      return {
        description: analysis.description || 'Unable to generate description',
        category: analysis.category || 'Uncategorized',
        confidence: Math.min(Math.max(analysis.confidence || 0.5, 0), 1),
        tags: this.extractTags(analysis.description || '')
      };
    } catch (error) {
      console.error('AI analysis error:', error);
      throw new Error(`AI analysis failed: ${error.message}`);
    }
  }

  parseTextResponse(text) {
    const description = text.match(/description[:\s]+([^,\n]+)/i)?.[1] || text.substring(0, 200);
    const category = text.match(/category[:\s]+([^,\n]+)/i)?.[1] || 'General';
    const confidence = parseFloat(text.match(/confidence[:\s]+([0-9.]+)/i)?.[1]) || 0.5;
    return { description: description.trim(), category: category.trim(), confidence };
  }

  extractTags(description) {
    const words = description.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    const meaningfulWords = words.filter(word =>
      !['this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'will', 'would', 'could', 'should'].includes(word)
    );
    return meaningfulWords.slice(0, 5);
  }

  async categorizeImages(imageUrls) {
    try {
      const results = await Promise.allSettled(
        imageUrls.map(url => this.analyzeImage(url))
      );
      return results.map((result, index) => ({
        imageUrl: imageUrls[index],
        success: result.status === 'fulfilled',
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason.message : null
      }));
    } catch (error) {
      console.error('Batch categorization error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
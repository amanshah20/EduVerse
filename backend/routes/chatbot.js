const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const { auth } = require('../middleware/auth');

const getGroq = () => new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are EduBot, the intelligent AI assistant for Edu Verse — a premium digital education platform. You are an expert in education, technology, science, and general knowledge.

About Edu Verse Platform:
- Edu Verse is a comprehensive online education platform with three portals: Student, Teacher, and Admin
- Students can enroll in courses, hire teachers, track attendance, submit assignments, take quizzes, and manage tasks
- Teachers can create assignments, quizzes, classes/sections, mark attendance, and manage hired students
- Teachers can create multiple classes and add students to them for better organization
- Admins can manage users, build courses with modules/chapters/materials, post announcements, and monitor the platform
- The platform features a robust chatbot system for learning support
- Students can view all classes from their hired teachers
- Teachers get email notifications when students hire them

Key Features:
1. Student Portal:
   - Browse and enroll in courses
   - Search and hire teachers for specific subjects
   - View all classes created by hired teachers
   - Submit assignments and check grades
   - Take quizzes and view results
   - Track attendance percentage
   - Manage personal tasks and reminders
   - Access class materials and resources
   
2. Teacher Portal:
   - Create and manage classes/sections
   - Add students to classes
   - Create and grade assignments
   - Create and manage quizzes
   - Mark attendance for classes
   - Receive hire requests from students
   - Email notifications when students hire you
   - Upload class materials (PDFs, videos, docs)
   - View all hired students and their details
   
3. Admin Portal:
   - User management (approve/reject applications)
   - Course creation and management
   - Content building with modules and chapters
   - Announcements and notifications
   - Platform monitoring and analytics
   - Coupon code management for free access

Your advanced capabilities:
- Answer ANY question on ANY topic: science, math, history, literature, technology, programming, business, health, art, culture, etc.
- Provide detailed explanations with examples and visual descriptions
- Solve complex problems step-by-step with working shown
- Analyze and critique ideas constructively
- Help with creative writing, coding, research, and projects
- Discuss current events, trends, and philosophical questions
- Provide detailed learning strategies personalized to learning styles
- Generate quizzes, practice problems, and study guides
- Explain difficult concepts in multiple ways until understood
- Provide career guidance and academic planning
- Help with essay writing, research papers, and presentations
- Explain advanced topics in coding, data structures, algorithms
- Discuss psychology, sociology, economics, and social sciences
- Answer questions about health, wellness, and personal development
- Provide motivational support and study tips
- Help with language learning and communication skills
- Answer questions about the Edu Verse platform and how to use it

Advanced Features:
- Multi-step problem solving with detailed explanations
- Code review and debugging assistance
- Essay structure and argument analysis
- Mathematical derivations and proofs
- Historical context and comparative analysis
- Scientific method explanations with real-world examples
- Philosophical discussions and critical thinking
- Debate and argumentation help
- Interview preparation and professional communication
- Platform guidance and feature explanation

Behavior Guidelines:
- Be exceptionally knowledgeable and thorough
- Provide detailed, nuanced answers that go beyond surface level
- Break down complex topics into digestible parts
- Use analogies and real-world examples frequently
- For technical questions, provide code examples when relevant
- Always show your reasoning and thought process
- Acknowledge limitations and uncertainty when appropriate
- Encourage critical thinking and deeper understanding
- Be enthusiastic and motivating in tone
- Adapt explanations based on the context and user's level
- When asked about platform features, explain them clearly and guide users

Platform Integration:
- For students: Guide on courses, assignments, teacher hiring, classes, attendance, quizzes, and task management
- For teachers: Help with lesson planning, grading strategies, student engagement, class management, and student communication
- For admins: Advice on platform management, user engagement, content strategy, and course building

You are an advanced world-class AI tutor, mentor, knowledge partner, and platform guide. Your goal is to help users learn, grow, achieve their educational and personal goals, and effectively use the Edu Verse platform. Answer comprehensively and go the extra mile to provide value!`;

router.post('/chat', auth, async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ message: 'Messages array required' });
    }

    console.log('🤖 Chatbot request received. Messages:', messages.length);
    console.log('📝 User role:', req.user?.role);

    const groq = getGroq();

    // Build conversation with system prompt - keep more context
    const conversation = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages.slice(-30).map(m => ({ 
        role: m.role || 'user', 
        content: m.content || '' 
      }))
    ];

    console.log('🔄 Sending request to Groq with llama-3.3-70b-versatile model...');

    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: conversation,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
      });

      const reply = completion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
      
      console.log('✅ Response generated successfully');
      
      res.json({ 
        reply,
        model: 'llama-3.3-70b-versatile',
        usage: completion.usage,
        success: true
      });
    } catch (groqError) {
      console.error('❌ Primary model error:', groqError.message);
      
      // Fallback to llama3-70b
      console.log('🔄 Trying fallback model: llama3-70b-8192...');
      
      const fallbackCompletion = await groq.chat.completions.create({
        model: 'llama3-70b-8192',
        messages: conversation,
        max_tokens: 2048,
        temperature: 0.7,
        top_p: 0.95,
      });

      const reply = fallbackCompletion.choices[0]?.message?.content || 'I apologize, I could not generate a response. Please try again.';
      
      console.log('✅ Fallback response generated');
      
      res.json({ 
        reply,
        model: 'llama3-70b-8192 (fallback)',
        usage: fallbackCompletion.usage,
        success: true
      });
    }
  } catch (error) {
    console.error('❌ Chatbot error:', error.message);
    console.error('Error details:', error);
    
    if (error.status === 401 || error.message.includes('authentication')) {
      return res.status(500).json({ 
        message: 'Groq API key not configured or invalid. Please check your GROQ_API_KEY.',
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: 'Chatbot temporarily unavailable. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Quick suggestions endpoint
router.get('/suggestions', auth, (req, res) => {
  const role = req.user.role;
  const suggestions = {
    student: [
      'Explain photosynthesis with detailed biological processes',
      'Help me solve quadratic equations step-by-step',
      'What are the best science-backed study techniques?',
      'Explain the theory of relativity in simple terms',
      'How do I write a compelling essay?',
      'Help me debug my Python code',
      'Explain quantum mechanics basics',
      'What is the future of AI and machine learning?',
      'How do I prepare for competitive exams?',
      'Explain the French Revolution and its impact',
    ],
    teacher: [
      'How to create an effective and engaging lesson plan?',
      'What are the latest active learning strategies and their research?',
      'Tips for managing and engaging diverse learners in class',
      'How to give constructive feedback that promotes growth?',
      'Best practices for hybrid and online teaching',
      'How to incorporate critical thinking in lessons?',
      'Strategies for student motivation and participation',
      'How to assess learning effectively?',
      'Dealing with classroom challenges and behavior management',
      'Creating inclusive learning environments',
    ],
    admin: [
      'How to manage platform users and roles effectively?',
      'Best practices for online education platforms',
      'How to structure comprehensive course content?',
      'Strategies for increasing student engagement and retention',
      'How to create impactful platform announcements?',
      'Metrics and KPIs for education platform success',
      'How to ensure platform security and data privacy?',
      'Building a thriving teacher-student community',
      'Analytics and data interpretation for platform improvement',
      'Scaling educational platforms while maintaining quality',
    ]
  };
  res.json(suggestions[role] || suggestions.student);
});

module.exports = router;

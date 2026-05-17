const pool = require('./config/database');
const bcrypt = require('bcryptjs');
require('dotenv').config();
dns.setDefaultResultOrder('ipv4first');

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up database...\n');
    console.log("DB URL:", process.env.DATABASE_URL);

    // Drop existing tables (in correct order due to foreign keys)
    await client.query('DROP TABLE IF EXISTS quiz_results CASCADE');
    await client.query('DROP TABLE IF EXISTS quiz_questions CASCADE');
    await client.query('DROP TABLE IF EXISTS chapters CASCADE');
    await client.query('DROP TABLE IF EXISTS modules CASCADE');
    await client.query('DROP TABLE IF EXISTS topics CASCADE');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✓ Dropped existing tables');

    // Create Users table
    await client.query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created users table');

    // Create Topics table
    await client.query(`
      CREATE TABLE topics (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created topics table');

    // Create Modules table
    await client.query(`
      CREATE TABLE modules (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created modules table');

    // Create Chapters table
    await client.query(`
      CREATE TABLE chapters (
        id SERIAL PRIMARY KEY,
        module_id INTEGER REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created chapters table');

    // Create Quiz Questions table
    await client.query(`
      CREATE TABLE quiz_questions (
        id SERIAL PRIMARY KEY,
        chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created quiz_questions table');

    // Create Quiz Results table
    await client.query(`
      CREATE TABLE quiz_results (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created quiz_results table');

    // Create admin user
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
    await client.query(
      'INSERT INTO users (email, password, is_admin) VALUES ($1, $2, $3)',
      [process.env.ADMIN_EMAIL || 'admin@tutorial.com', hashedPassword, true]
    );
    console.log('✓ Created admin user');

    // Insert sample data
    console.log('\n📦 Inserting sample data...\n');

    // Sample Topic: Java Programming
    const topicResult = await client.query(
      `INSERT INTO topics (title, description) 
       VALUES ($1, $2) RETURNING id`,
      ['Java Programming', 'Master the fundamentals of Java programming language']
    );
    const topicId = topicResult.rows[0].id;
    console.log('✓ Created topic: Java Programming');

    // Sample Module: Object-Oriented Programming
    const moduleResult = await client.query(
      `INSERT INTO modules (topic_id, title, description, order_index) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [topicId, 'Object-Oriented Programming', 'Learn the core concepts of OOP in Java', 1]
    );
    const moduleId = moduleResult.rows[0].id;
    console.log('✓ Created module: Object-Oriented Programming');

    // Sample Chapter: Encapsulation
    const chapterContent = `# Encapsulation in Java

## What is Encapsulation?

**Encapsulation** is one of the four fundamental OOP concepts. It refers to the bundling of data (variables) and methods that operate on the data into a single unit called a class.

## Key Benefits

- **Data Hiding**: Protects object data from unauthorized access
- **Flexibility**: You can change implementation without affecting other code
- **Maintainability**: Makes code easier to maintain and modify

## Implementation

In Java, encapsulation is achieved by:

1. Declaring class variables as **private**
2. Providing **public getter and setter** methods

### Example Code

\`\`\`java
public class Student {
    // Private variables (data hiding)
    private String name;
    private int age;
    
    // Public getter for name
    public String getName() {
        return name;
    }
    
    // Public setter for name
    public void setName(String name) {
        this.name = name;
    }
    
    // Public getter for age
    public int getAge() {
        return age;
    }
    
    // Public setter for age with validation
    public void setAge(int age) {
        if (age > 0) {
            this.age = age;
        }
    }
}
\`\`\`

## Usage Example

\`\`\`java
public class Main {
    public static void main(String[] args) {
        Student student = new Student();
        
        // Using setter methods
        student.setName("John Doe");
        student.setAge(20);
        
        // Using getter methods
        System.out.println("Name: " + student.getName());
        System.out.println("Age: " + student.getAge());
    }
}
\`\`\`

## Best Practices

- Always keep instance variables **private**
- Use **meaningful names** for getters and setters
- Add **validation logic** in setters when needed
- Only expose methods that are necessary

## Summary

Encapsulation helps create secure, maintainable code by controlling access to class members and protecting object integrity.`;

    const chapterResult = await client.query(
      `INSERT INTO chapters (module_id, title, content, order_index) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [moduleId, 'Encapsulation', chapterContent, 1]
    );
    const chapterId = chapterResult.rows[0].id;
    console.log('✓ Created chapter: Encapsulation');

    // Sample Quiz Questions
    const questions = [
      {
        question: 'What is the main purpose of encapsulation in Java?',
        options: [
          'To increase program execution speed',
          'To bundle data and methods together and hide internal details',
          'To allow multiple inheritance',
          'To create abstract classes'
        ],
        correct_answer: 1,
        explanation: 'Encapsulation bundles data and methods into a class and hides the internal implementation details from outside access.',
        order_index: 1
      },
      {
        question: 'Which access modifier should be used for instance variables to achieve proper encapsulation?',
        options: [
          'public',
          'protected',
          'private',
          'default'
        ],
        correct_answer: 2,
        explanation: 'Instance variables should be declared as private to prevent direct access from outside the class, which is a key principle of encapsulation.',
        order_index: 2
      },
      {
        question: 'What are getter and setter methods used for?',
        options: [
          'To inherit properties from parent class',
          'To provide controlled access to private variables',
          'To override methods',
          'To create static variables'
        ],
        correct_answer: 1,
        explanation: 'Getter and setter methods provide controlled access to private instance variables, allowing validation and maintaining encapsulation.',
        order_index: 3
      },
      {
        question: 'Which of the following is a benefit of encapsulation?',
        options: [
          'Faster code execution',
          'Better data security and flexibility',
          'Automatic memory management',
          'Multiple inheritance support'
        ],
        correct_answer: 1,
        explanation: 'Encapsulation provides better data security by hiding internal details and offers flexibility to change implementation without affecting other code.',
        order_index: 4
      }
    ];

    for (const q of questions) {
      await client.query(
        `INSERT INTO quiz_questions (chapter_id, question, options, correct_answer, explanation, order_index) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [chapterId, q.question, JSON.stringify(q.options), q.correct_answer, q.explanation, q.order_index]
      );
    }
    console.log('✓ Created quiz questions (4 questions)');

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('📧 Admin credentials:');
    console.log(`   Email: ${process.env.ADMIN_EMAIL || 'admin@tutorial.com'}`);
    console.log(`   Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log('\n⚠️  Please change these credentials after first login!\n');

  } catch (error) {
    console.error('❌ Error setting up database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

setupDatabase();

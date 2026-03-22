# Database Schema Documentation

## Overview
This is a comprehensive database schema for a personalized AI learning platform where users can create courses, organize materials, interact with AI chat assistants, take quizzes, and access short Q&As.

## Entity Relationship Diagram (Text Format)

```
USER (1) ──────< (M) COURSE (1) ──────< (M) TOPIC
                       │                       │
                       │ (1)                   │ (1)
                       │                       │
                       ├──< (M) MATERIAL ──────┘ (M) [Optional Link]
                       │
                       ├──< (M) CHAT (1) ──────< (M) CHAT_MESSAGE
                       │
                       ├──< (M) QUIZ (1) ──────< (M) QUIZ_QUESTION
                       │
                       └──< (M) SHORT_QA
```

## Tables

### 1. **tbl_user**
Core user information.

| Column      | Type         | Constraints           | Description              |
|-------------|-------------|-----------------------|--------------------------|
| user_id     | text        | PRIMARY KEY, NOT NULL | Unique user identifier   |
| first_name  | varchar(255)| NOT NULL              | User's first name        |
| last_name   | varchar(255)|                       | User's last name         |
| email       | varchar(255)| NOT NULL, UNIQUE      | User's email address     |
| password    | text        | NOT NULL              | Hashed password          |
| avatar      | text        |                       | Avatar URL               |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW | Creation timestamp       |
| updated_at  | timestamp   | AUTO UPDATE           | Last update timestamp    |

**Relations:**
- One user has many courses
- One user has many chats

---

### 2. **tbl_course**
Courses created by users.

| Column      | Type         | Constraints                    | Description              |
|-------------|-------------|--------------------------------|--------------------------|
| course_id   | text        | PRIMARY KEY, NOT NULL          | Unique course identifier |
| user_id     | text        | FK → user.user_id, CASCADE     | Owner user ID            |
| name        | varchar(255)| NOT NULL                       | Course name              |
| description | text        |                                | Course description       |
| color       | varchar(50) | DEFAULT '#3B82F6'              | UI color theme           |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW          | Creation timestamp       |
| updated_at  | timestamp   | AUTO UPDATE                    | Last update timestamp    |

**Relations:**
- Belongs to one user
- Has many topics
- Has many materials
- Has many chats
- Has many quizzes
- Has many short Q&As

---

### 3. **tbl_topic**
Topics within a course (e.g., chapters or modules).

| Column      | Type         | Constraints                      | Description              |
|-------------|-------------|----------------------------------|--------------------------|
| topic_id    | text        | PRIMARY KEY, NOT NULL            | Unique topic identifier  |
| course_id   | text        | FK → course.course_id, CASCADE   | Parent course ID         |
| name        | varchar(255)| NOT NULL                         | Topic name               |
| description | text        |                                  | Topic description        |
| content     | text        |                                  | Course content/lessons   |
| order_index | integer     | DEFAULT 0                        | Display order            |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp       |
| updated_at  | timestamp   | AUTO UPDATE                      | Last update timestamp    |

**Relations:**
- Belongs to one course
- Has many materials (optional)

---

### 4. **tbl_material**
Learning materials (PDFs, videos, links, etc.) for courses.

| Column      | Type         | Constraints                      | Description                 |
|-------------|-------------|----------------------------------|-----------------------------|
| material_id | text        | PRIMARY KEY, NOT NULL            | Unique material identifier  |
| course_id   | text        | FK → course.course_id, CASCADE   | Parent course ID            |
| topic_id    | text        | FK → topic.topic_id, SET NULL    | Optional topic link         |
| name        | varchar(255)| NOT NULL                         | Material name               |
| description | text        |                                  | Material description        |
| type        | varchar(50) | NOT NULL                         | pdf, video, link, document  |
| url         | text        | NOT NULL                         | File URL or external link   |
| file_size   | text        |                                  | File size (for uploads)     |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp          |
| updated_at  | timestamp   | AUTO UPDATE                      | Last update timestamp       |

**Relations:**
- Belongs to one course (required)
- Optionally belongs to one topic

**Note:** Materials MUST be linked to a course but MAY optionally be linked to a specific topic.

---

### 5. **tbl_chat**
AI chat conversations within a course context.

| Column      | Type         | Constraints                      | Description              |
|-------------|-------------|----------------------------------|--------------------------|
| chat_id     | text        | PRIMARY KEY, NOT NULL            | Unique chat identifier   |
| course_id   | text        | FK → course.course_id, CASCADE   | Parent course ID         |
| user_id     | text        | FK → user.user_id, CASCADE       | Chat owner user ID       |
| title       | varchar(255)| DEFAULT 'New Chat'               | Chat conversation title  |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp       |
| updated_at  | timestamp   | AUTO UPDATE                      | Last update timestamp    |

**Relations:**
- Belongs to one course
- Belongs to one user
- Has many chat messages

---

### 6. **tbl_chat_message**
Individual messages in a chat conversation (supports file attachments like ChatGPT).

| Column      | Type         | Constraints                      | Description                  |
|-------------|-------------|----------------------------------|------------------------------|
| message_id  | text        | PRIMARY KEY, NOT NULL            | Unique message identifier    |
| chat_id     | text        | FK → chat.chat_id, CASCADE       | Parent chat ID               |
| role        | varchar(20) | NOT NULL                         | 'user' or 'assistant'        |
| content     | text        | NOT NULL                         | Message text content         |
| attachments | jsonb       |                                  | Array of file attachments    |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp           |

**Attachments JSON Structure:**
```json
[
  {
    "name": "document.pdf",
    "url": "https://...",
    "type": "pdf",
    "size": "2.5 MB"
  }
]
```

**Relations:**
- Belongs to one chat

---

### 7. **tbl_quiz**
Quizzes for testing knowledge in a course.

| Column        | Type         | Constraints                      | Description              |
|--------------|-------------|----------------------------------|--------------------------|
| quiz_id      | text        | PRIMARY KEY, NOT NULL            | Unique quiz identifier   |
| course_id    | text        | FK → course.course_id, CASCADE   | Parent course ID         |
| title        | varchar(255)| NOT NULL                         | Quiz title               |
| description  | text        |                                  | Quiz description         |
| time_limit   | integer     |                                  | Time limit (minutes)     |
| passing_score| integer     | DEFAULT 70                       | Passing percentage       |
| created_at   | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp       |
| updated_at   | timestamp   | AUTO UPDATE                      | Last update timestamp    |

**Relations:**
- Belongs to one course
- Has many quiz questions

---

### 8. **tbl_quiz_question**
Individual questions in a quiz.

| Column        | Type         | Constraints                      | Description                    |
|--------------|-------------|----------------------------------|--------------------------------|
| question_id  | text        | PRIMARY KEY, NOT NULL            | Unique question identifier     |
| quiz_id      | text        | FK → quiz.quiz_id, CASCADE       | Parent quiz ID                 |
| question     | text        | NOT NULL                         | Question text                  |
| question_type| varchar(50) | NOT NULL                         | mcq, true-false, multiple-select|
| options      | jsonb       | NOT NULL                         | Answer options array           |
| correct_answer| jsonb      | NOT NULL                         | Correct answer(s)              |
| explanation  | text        |                                  | Answer explanation             |
| points       | integer     | DEFAULT 1                        | Points for correct answer      |
| order_index  | integer     | DEFAULT 0                        | Display order                  |
| created_at   | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp             |
| updated_at   | timestamp   | AUTO UPDATE                      | Last update timestamp          |

**Options JSON Structure:**
```json
[
  {"id": "a", "text": "Option A"},
  {"id": "b", "text": "Option B"},
  {"id": "c", "text": "Option C"},
  {"id": "d", "text": "Option D"}
]
```

**Correct Answer Examples:**
- MCQ: `"a"` or `{"id": "a"}`
- Multiple Select: `["a", "c"]`
- True/False: `"true"` or `"false"`

**Relations:**
- Belongs to one quiz

---

### 9. **tbl_short_qa**
Short question-answer pairs for quick reference in a course.

| Column      | Type         | Constraints                      | Description              |
|-------------|-------------|----------------------------------|--------------------------|
| qa_id       | text        | PRIMARY KEY, NOT NULL            | Unique Q&A identifier    |
| course_id   | text        | FK → course.course_id, CASCADE   | Parent course ID         |
| question    | text        | NOT NULL                         | Question text            |
| answer      | text        | NOT NULL                         | Answer text              |
| category    | varchar(100)|                                  | Optional categorization  |
| created_at  | timestamp   | NOT NULL, DEFAULT NOW            | Creation timestamp       |
| updated_at  | timestamp   | AUTO UPDATE                      | Last update timestamp    |

**Relations:**
- Belongs to one course

---

## Key Features

### 1. **Cascade Deletion**
- When a user is deleted → all their courses and chats are deleted
- When a course is deleted → all related topics, materials, chats, quizzes, and short Q&As are deleted
- When a topic is deleted → materials linked to it set `topic_id` to NULL (not deleted)
- When a chat is deleted → all messages are deleted
- When a quiz is deleted → all questions are deleted

### 2. **Flexible Material Organization**
Materials are **required** to be linked to a course but **optionally** linked to a topic. This allows:
- General course materials not tied to specific topics
- Topic-specific materials for detailed organization

### 3. **Rich Chat Experience**
Chat messages support:
- Role-based messages (user/assistant)
- File attachments stored as JSONB arrays
- Multiple chats per course for different contexts

### 4. **Dynamic Quiz System**
- Supports multiple question types (MCQ, multiple-select, true/false)
- Flexible answer storage using JSONB
- Points and ordering for each question
- Time limits and passing scores per quiz

### 5. **Structured Content Hierarchy**
```
User
 └── Course
      ├── Topics (ordered)
      │    ├── Content
      │    └── Materials (optional)
      ├── Materials (course-level)
      ├── Chats
      │    └── Messages (with attachments)
      ├── Quizzes
      │    └── Questions (ordered, scored)
      └── Short Q&As (categorized)
```

## Migration Notes

To apply this schema:
```bash
npm run db:generate  # Generate migration
npm run db:migrate   # Apply migration
```

## Future Extensions

Potential additions:
- `tbl_user_progress` - Track user completion of topics/quizzes
- `tbl_quiz_attempt` - Store user quiz submissions
- `tbl_study_session` - Track study time and analytics
- `tbl_note` - User notes on topics/materials
- `tbl_flashcard` - Spaced repetition flashcards

import { relations } from 'drizzle-orm';
import { chatTable } from './tbl-chat';
import { chatMessageTable } from './tbl-chat-message';
import { courseTable } from './tbl-course';
import { examPatternTable } from './tbl-exam-pattern';
import { examResultTable } from './tbl-exam-result';
import { examSessionTable } from './tbl-exam-session';
import { generatedExamTable } from './tbl-generated-exam';
import { materialTable } from './tbl-material';
import { materialChunksTable } from './tbl-material-chunks';
import { quizTable } from './tbl-quiz';
import { quizQuestionTable } from './tbl-quiz-question';
import { shortQATable } from './tbl-short-qa';
import { topicTable } from './tbl-topic';
import { userTable } from './tbl-user';
import { mathChatTable } from './tbl-math-chat';
import { mathChatMessageTable } from './tbl-math-chat-message';
import { mathMessageWebSearchTable } from './tbl-math-message-web-search';
import { researchChatTable } from './tbl-research-chat';
import { researchChatMessageTable } from './tbl-research-chat-message';
import { studyPathTable } from './tbl-study-path';

// User Relations - One User has Many Courses and Chats
export const userRelations = relations(userTable, ({ many }) => ({
  courses: many(courseTable),
  chats: many(chatTable),
  mathChats: many(mathChatTable),
  mathMessageWebSearches: many(mathMessageWebSearchTable),
  researchChats: many(researchChatTable),
  studyPaths: many(studyPathTable),
}));

// Course Relations - One Course belongs to One User and has Many Topics, Materials, Chats, Quizzes, and Short Q&As
export const courseRelations = relations(courseTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [courseTable.userId],
    references: [userTable.userId],
  }),
  topics: many(topicTable),
  materials: many(materialTable),
  chats: many(chatTable),
  quizzes: many(quizTable),
  shortQAs: many(shortQATable),
  studyPaths: many(studyPathTable),
}));

// Topic Relations - One Topic belongs to One Course and has Many Materials
export const topicRelations = relations(topicTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [topicTable.courseId],
    references: [courseTable.courseId],
  }),
  materials: many(materialTable),
}));

// Material Relations - One Material belongs to One Course and optionally to One Topic, and has Many Chunks
export const materialRelations = relations(materialTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [materialTable.courseId],
    references: [courseTable.courseId],
  }),
  topic: one(topicTable, {
    fields: [materialTable.topicId],
    references: [topicTable.topicId],
  }),
  chunks: many(materialChunksTable),
}));

// Material Chunks Relations - One Chunk belongs to One Material
export const materialChunksRelations = relations(materialChunksTable, ({ one }) => ({
  material: one(materialTable, {
    fields: [materialChunksTable.materialId],
    references: [materialTable.materialId],
  }),
}));

// Chat Relations - One Chat belongs to One Course and One User, and has Many Messages
export const chatRelations = relations(chatTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [chatTable.courseId],
    references: [courseTable.courseId],
  }),
  user: one(userTable, {
    fields: [chatTable.userId],
    references: [userTable.userId],
  }),
  messages: many(chatMessageTable),
}));

// Chat Message Relations - One Message belongs to One Chat
export const chatMessageRelations = relations(chatMessageTable, ({ one }) => ({
  chat: one(chatTable, {
    fields: [chatMessageTable.chatId],
    references: [chatTable.chatId],
  }),
}));

// Quiz Relations - One Quiz belongs to One Course and has Many Questions
export const quizRelations = relations(quizTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [quizTable.courseId],
    references: [courseTable.courseId],
  }),
  questions: many(quizQuestionTable),
}));

// Quiz Question Relations - One Question belongs to One Quiz
export const quizQuestionRelations = relations(
  quizQuestionTable,
  ({ one }) => ({
    quiz: one(quizTable, {
      fields: [quizQuestionTable.quizId],
      references: [quizTable.quizId],
    }),
  })
);

// Short Q&A Relations - One Short Q&A belongs to One Course
export const shortQARelations = relations(shortQATable, ({ one }) => ({
  course: one(courseTable, {
    fields: [shortQATable.courseId],
    references: [courseTable.courseId],
  }),
}));

// Math Chat Relations - One Math Chat belongs to One User and has Many Messages
export const mathChatRelations = relations(mathChatTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [mathChatTable.userId],
    references: [userTable.userId],
  }),
  messages: many(mathChatMessageTable),
  webSearches: many(mathMessageWebSearchTable),
}));

// Math Chat Message Relations - One Message belongs to One Math Chat
export const mathChatMessageRelations = relations(mathChatMessageTable, ({ one, many }) => ({
  mathChat: one(mathChatTable, {
    fields: [mathChatMessageTable.mathChatId],
    references: [mathChatTable.mathChatId],
  }),
  webSearches: many(mathMessageWebSearchTable),
}));

// Math Message Web Search Relations - One search belongs to One Message, One Math Chat, and One User
export const mathMessageWebSearchRelations = relations(
  mathMessageWebSearchTable,
  ({ one }) => ({
    message: one(mathChatMessageTable, {
      fields: [mathMessageWebSearchTable.messageId],
      references: [mathChatMessageTable.messageId],
    }),
    mathChat: one(mathChatTable, {
      fields: [mathMessageWebSearchTable.mathChatId],
      references: [mathChatTable.mathChatId],
    }),
    user: one(userTable, {
      fields: [mathMessageWebSearchTable.userId],
      references: [userTable.userId],
    }),
  })
);

// Research Chat Relations - One Research Chat belongs to One User and has Many Messages
export const researchChatRelations = relations(researchChatTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [researchChatTable.userId],
    references: [userTable.userId],
  }),
  messages: many(researchChatMessageTable),
}));

// Research Chat Message Relations - One Message belongs to One Research Chat
export const researchChatMessageRelations = relations(researchChatMessageTable, ({ one }) => ({
  researchChat: one(researchChatTable, {
    fields: [researchChatMessageTable.researchChatId],
    references: [researchChatTable.researchChatId],
  }),
}));

// Exam Pattern Relations - One Pattern has Many Generated Exams
export const examPatternRelations = relations(examPatternTable, ({ many }) => ({
  generatedExams: many(generatedExamTable),
}));

// Generated Exam Relations - One Exam belongs to One Course and One Pattern, has Many Sessions
export const generatedExamRelations = relations(generatedExamTable, ({ one, many }) => ({
  course: one(courseTable, {
    fields: [generatedExamTable.courseId],
    references: [courseTable.courseId],
  }),
  examPattern: one(examPatternTable, {
    fields: [generatedExamTable.examPatternId],
    references: [examPatternTable.examPatternId],
  }),
  sessions: many(examSessionTable),
}));

// Exam Session Relations - One Session belongs to One User and One Exam, has One Result
export const examSessionRelations = relations(examSessionTable, ({ one, many }) => ({
  user: one(userTable, {
    fields: [examSessionTable.userId],
    references: [userTable.userId],
  }),
  generatedExam: one(generatedExamTable, {
    fields: [examSessionTable.generatedExamId],
    references: [generatedExamTable.generatedExamId],
  }),
  results: many(examResultTable),
}));

// Exam Result Relations - One Result belongs to One Session and One User
export const examResultRelations = relations(examResultTable, ({ one }) => ({
  examSession: one(examSessionTable, {
    fields: [examResultTable.examSessionId],
    references: [examSessionTable.examSessionId],
  }),
  user: one(userTable, {
    fields: [examResultTable.userId],
    references: [userTable.userId],
  }),
}));

// Study Path Relations - One study path belongs to one user and one course
export const studyPathRelations = relations(studyPathTable, ({ one }) => ({
  user: one(userTable, {
    fields: [studyPathTable.userId],
    references: [userTable.userId],
  }),
  course: one(courseTable, {
    fields: [studyPathTable.courseId],
    references: [courseTable.courseId],
  }),
}));

// Course Relations Extension - One Course has Many Generated Exams
export const courseRelationsExtended = relations(courseTable, ({ many }) => ({
  generatedExams: many(generatedExamTable),
}));

// User Relations Extension - One User has Many Exam Sessions and Results
export const userRelationsExtended = relations(userTable, ({ many }) => ({
  examSessions: many(examSessionTable),
  examResults: many(examResultTable),
}));

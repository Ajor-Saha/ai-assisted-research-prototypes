import { relations } from 'drizzle-orm';
import { chatTable } from './tbl-chat';
import { chatMessageTable } from './tbl-chat-message';
import { courseTable } from './tbl-course';
import { materialTable } from './tbl-material';
import { materialChunksTable } from './tbl-material-chunks';
import { quizTable } from './tbl-quiz';
import { quizQuestionTable } from './tbl-quiz-question';
import { shortQATable } from './tbl-short-qa';
import { topicTable } from './tbl-topic';
import { userTable } from './tbl-user';
import { mathChatTable } from './tbl-math-chat';
import { mathChatMessageTable } from './tbl-math-chat-message';
import { researchChatTable } from './tbl-research-chat';
import { researchChatMessageTable } from './tbl-research-chat-message';

// User Relations - One User has Many Courses and Chats
export const userRelations = relations(userTable, ({ many }) => ({
  courses: many(courseTable),
  chats: many(chatTable),
  mathChats: many(mathChatTable),
  researchChats: many(researchChatTable),
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
}));

// Math Chat Message Relations - One Message belongs to One Math Chat
export const mathChatMessageRelations = relations(mathChatMessageTable, ({ one }) => ({
  mathChat: one(mathChatTable, {
    fields: [mathChatMessageTable.mathChatId],
    references: [mathChatTable.mathChatId],
  }),
}));

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

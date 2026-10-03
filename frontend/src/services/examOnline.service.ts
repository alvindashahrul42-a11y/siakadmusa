import axios from 'axios';
import type {
  QuestionSet, QuestionSetFormData, QuestionSetListResponse, QuestionSetDetailResponse,
  Question, QuestionFormData, QuestionOptionFormData, QuestionListResponse, QuestionDetailResponse,
  ExamAttempt, StartAttemptResponse, AttemptListResponse,
  ExamAnswer, SaveAnswerPayload, GradeEssayPayload, AnswerListResponse,
  StudentExamSchedule,
} from '../types/examOnline';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const h   = (token: string) => ({ Authorization: `Bearer ${token}` });

// ── QuestionSet ───────────────────────────────────────────────────────────────

export const getQuestionSets = async (
  params: { page?: number; limit?: number; search?: string; subject_id?: string; status?: string },
  token: string
): Promise<QuestionSetListResponse> => {
  const res = await axios.get<QuestionSetListResponse>(`${API}/question-sets`, { params, headers: h(token) });
  return res.data;
};

export const getQuestionSetsReady = async (subject_id: string, token: string): Promise<QuestionSet[]> => {
  const res = await axios.get<{ success: boolean; data: { questionSets: QuestionSet[] } }>(
    `${API}/question-sets/ready`, { params: { subject_id }, headers: h(token) }
  );
  return res.data.data.questionSets;
};

export const getQuestionSetById = async (id: string, token: string): Promise<QuestionSet> => {
  const res = await axios.get<QuestionSetDetailResponse>(`${API}/question-sets/${id}`, { headers: h(token) });
  return res.data.data.questionSet;
};

export const createQuestionSet = async (data: QuestionSetFormData, token: string): Promise<QuestionSet> => {
  const res = await axios.post<QuestionSetDetailResponse>(`${API}/question-sets`, data, { headers: h(token) });
  return res.data.data.questionSet;
};

export const updateQuestionSet = async (id: string, data: Partial<QuestionSetFormData>, token: string): Promise<QuestionSet> => {
  const res = await axios.put<QuestionSetDetailResponse>(`${API}/question-sets/${id}`, data, { headers: h(token) });
  return res.data.data.questionSet;
};

export const deleteQuestionSet = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API}/question-sets/${id}`, { headers: h(token) });
};

// ── Questions ─────────────────────────────────────────────────────────────────

export const getQuestions = async (question_set_id: string, token: string): Promise<{ questions: Question[]; question_set: QuestionSet }> => {
  const res = await axios.get<QuestionListResponse>(`${API}/questions`, {
    params: { question_set_id }, headers: h(token),
  });
  return res.data.data;
};

export const getQuestionById = async (id: string, token: string): Promise<Question> => {
  const res = await axios.get<QuestionDetailResponse>(`${API}/questions/${id}`, { headers: h(token) });
  return res.data.data.question;
};

export const createQuestion = async (data: QuestionFormData, token: string): Promise<Question> => {
  const res = await axios.post<QuestionDetailResponse>(`${API}/questions`, data, { headers: h(token) });
  return res.data.data.question;
};

export const updateQuestion = async (
  id: string,
  data: Partial<QuestionFormData>,
  token: string
): Promise<Question> => {
  const res = await axios.put<QuestionDetailResponse>(`${API}/questions/${id}`, data, { headers: h(token) });
  return res.data.data.question;
};

export const deleteQuestion = async (id: string, token: string): Promise<void> => {
  await axios.delete(`${API}/questions/${id}`, { headers: h(token) });
};

export const replaceOptions = async (
  question_id: string,
  options: QuestionOptionFormData[],
  token: string
): Promise<void> => {
  await axios.put(`${API}/questions/${question_id}/options`, { options }, { headers: h(token) });
};

export const reorderQuestions = async (
  question_set_id: string,
  orders: { id: string; sort_order: number }[],
  token: string
): Promise<void> => {
  await axios.patch(`${API}/questions/reorder`, { question_set_id, orders }, { headers: h(token) });
};

// ── ExamAttempt ───────────────────────────────────────────────────────────────

export const startAttempt = async (exam_schedule_id: string, token: string): Promise<StartAttemptResponse['data']> => {
  const res = await axios.post<StartAttemptResponse>(
    `${API}/exam-attempts/start`,
    { exam_schedule_id },
    { headers: h(token) }
  );
  return res.data.data;
};

export const submitAttempt = async (attempt_id: string, token: string): Promise<ExamAttempt> => {
  const res = await axios.post<{ success: boolean; data: { attempt: ExamAttempt } }>(
    `${API}/exam-attempts/${attempt_id}/submit`,
    {},
    { headers: h(token) }
  );
  return res.data.data.attempt;
};

export const timeoutAttempt = async (attempt_id: string, token: string): Promise<ExamAttempt> => {
  const res = await axios.post<{ success: boolean; data: { attempt: ExamAttempt } }>(
    `${API}/exam-attempts/${attempt_id}/timeout`,
    {},
    { headers: h(token) }
  );
  return res.data.data.attempt;
};

export const recordTabSwitch = async (attempt_id: string, token: string): Promise<void> => {
  await axios.patch(`${API}/exam-attempts/${attempt_id}/tab-switch`, {}, { headers: h(token) });
};

export const getAttemptsBySchedule = async (
  exam_schedule_id: string,
  token: string
): Promise<AttemptListResponse['data']> => {
  const res = await axios.get<AttemptListResponse>(`${API}/exam-attempts`, {
    params: { exam_schedule_id }, headers: h(token),
  });
  return res.data.data;
};

export const getAttemptById = async (id: string, token: string): Promise<ExamAttempt> => {
  const res = await axios.get<{ success: boolean; data: { attempt: ExamAttempt } }>(
    `${API}/exam-attempts/${id}`, { headers: h(token) }
  );
  return res.data.data.attempt;
};

export const getMyExamSchedules = async (token: string): Promise<StudentExamSchedule[]> => {
  const res = await axios.get<{ success: boolean; data: { schedules: StudentExamSchedule[] } }>(
    `${API}/exam-attempts/my`, { headers: h(token) }
  );
  return res.data.data.schedules;
};

// ── ExamAnswer ────────────────────────────────────────────────────────────────

export const saveAnswer = async (payload: SaveAnswerPayload, token: string): Promise<ExamAnswer> => {
  const res = await axios.post<{ success: boolean; data: { answer: ExamAnswer } }>(
    `${API}/exam-answers`, payload, { headers: h(token) }
  );
  return res.data.data.answer;
};

export const getAnswersByAttempt = async (attempt_id: string, token: string): Promise<AnswerListResponse['data']> => {
  const res = await axios.get<AnswerListResponse>(`${API}/exam-answers`, {
    params: { attempt_id }, headers: h(token),
  });
  return res.data.data;
};

export const gradeEssayAnswer = async (
  answer_id: string,
  payload: GradeEssayPayload,
  token: string
): Promise<ExamAnswer> => {
  const res = await axios.patch<{ success: boolean; data: { answer: ExamAnswer } }>(
    `${API}/exam-answers/${answer_id}/grade`, payload, { headers: h(token) }
  );
  return res.data.data.answer;
};

// ── Question Import / Export ──────────────────────────────────────────────────

/** Download template Excel soal — returns blob */
export const downloadQuestionTemplate = async (token: string): Promise<Blob> => {
  const res = await axios.get(`${API}/questions/template`, {
    headers: h(token),
    responseType: 'blob',
  });
  return res.data;
};

/** Upload file Excel soal bulk ke question_set_id */
export const importQuestions = async (
  question_set_id: string,
  file: File,
  token: string
): Promise<{ imported_count: number; questions: Question[] }> => {
  const form = new FormData();
  form.append('file', file);
  const res = await axios.post<{ success: boolean; data: { imported_count: number; questions: Question[] } }>(
    `${API}/questions/import`,
    form,
    {
      params:  { question_set_id },
      headers: { ...h(token), 'Content-Type': 'multipart/form-data' },
    }
  );
  return res.data.data;
};

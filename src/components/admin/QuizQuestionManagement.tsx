import React, { useEffect, useState } from 'react';
import { jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table } from '@/components/ui/table';

interface QuizQuestion {
  id: string;
  question_text: string;
  answers: string[];
  correct_answer: string;
  difficulty: number;
  category: string;
  is_active: boolean;
  image_url?: string;
}

const defaultForm: Partial<QuizQuestion> = {
  question_text: '',
  answers: ['', '', '', ''],
  correct_answer: '',
  difficulty: 1,
  category: 'cs2',
  is_active: true,
  image_url: '',
};

const QuizQuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<Partial<QuizQuestion>>(defaultForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Загрузка вопросов
  const fetchQuestions = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) setError(error.message);
    else setQuestions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, []);

  // Открыть форму для добавления/редактирования
  const openForm = (q?: QuizQuestion) => {
    if (q) {
      setForm({ ...q, answers: typeof q.answers === 'string' ? JSON.parse(q.answers) : q.answers });
      setEditId(q.id);
    } else {
      setForm(defaultForm);
      setEditId(null);
    }
    setShowDialog(true);
  };

  // Сохранить вопрос
  const saveQuestion = async () => {
    setLoading(true);
    setError(null);
    const payload = {
      ...form,
      answers: JSON.stringify(form.answers),
      difficulty: Number(form.difficulty) || 1,
      is_active: !!form.is_active,
    };
    let res;
    if (editId) {
      res = await supabase.from('quiz_questions').update(payload).eq('id', editId);
    } else {
      res = await supabase.from('quiz_questions').insert([payload]);
    }
    if (res.error) setError(res.error.message);
    else {
      setShowDialog(false);
      fetchQuestions();
    }
    setLoading(false);
  };

  // Удалить вопрос
  const deleteQuestion = async () => {
    if (!deleteId) return;
    setLoading(true);
    const { error } = await supabase.from('quiz_questions').delete().eq('id', deleteId);
    if (error) setError(error.message);
    else fetchQuestions();
    setDeleteId(null);
    setLoading(false);
  };

  // Обработка изменений формы
  const handleFormChange = (field: keyof QuizQuestion, value: any) => {
    setForm((prev: Partial<QuizQuestion>) => ({ ...prev, [field]: value }));
  };
  const handleAnswerChange = (idx: number, value: string) => {
    setForm((prev: Partial<QuizQuestion>) => ({ ...prev, answers: prev.answers?.map((a: string, i: number) => (i === idx ? value : a)) }));
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Card className="mb-6 p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Вопросы викторины</h2>
        <Button onClick={() => openForm()}>Добавить вопрос</Button>
      </Card>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <Table>
        <thead>
          <tr>
            <th>Вопрос</th>
            <th>Категория</th>
            <th>Сложность</th>
            <th>Активен</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id}>
              <td>{q.question_text}</td>
              <td><Badge>{q.category}</Badge></td>
              <td>{q.difficulty}</td>
              <td>{q.is_active ? 'Да' : 'Нет'}</td>
              <td>
                <Button size="sm" onClick={() => openForm(q)}>Редактировать</Button>
                <Button size="sm" variant="destructive" onClick={() => setDeleteId(q.id)} className="ml-2">Удалить</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      {/* Диалог добавления/редактирования */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogTitle>{editId ? 'Редактировать вопрос' : 'Добавить вопрос'}</DialogTitle>
          <div className="space-y-3">
            <Input
              label="Вопрос"
              value={form.question_text || ''}
              onChange={e => handleFormChange('question_text', e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              {form.answers?.map((a, i) => (
                <Input
                  key={i}
                  label={`Вариант ${i + 1}`}
                  value={a}
                  onChange={e => handleAnswerChange(i, e.target.value)}
                  required
                />
              ))}
            </div>
            <Input
              label="Правильный ответ (точно как в вариантах)"
              value={form.correct_answer || ''}
              onChange={e => handleFormChange('correct_answer', e.target.value)}
              required
            />
            <Input
              label="Категория"
              value={form.category || ''}
              onChange={e => handleFormChange('category', e.target.value)}
            />
            <Input
              label="Сложность"
              type="number"
              min={1}
              max={5}
              value={form.difficulty || 1}
              onChange={e => handleFormChange('difficulty', e.target.value)}
            />
            <Input
              label="Ссылка на картинку (опционально)"
              value={form.image_url || ''}
              onChange={e => handleFormChange('image_url', e.target.value)}
            />
            {form.image_url && (
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs text-slate-400 mb-1">Предпросмотр картинки:</span>
                <img
                  src={form.image_url}
                  alt="preview"
                  className="max-h-40 rounded-lg border border-slate-200 shadow"
                  onError={e => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={!!form.is_active}
                onChange={e => handleFormChange('is_active', e.target.checked)}
              />
              Активен
            </label>
          </div>
          <DialogFooter>
            <Button onClick={saveQuestion} loading={loading}>{editId ? 'Сохранить' : 'Добавить'}</Button>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogTitle>Удалить вопрос?</DialogTitle>
          <div>Вы уверены, что хотите удалить этот вопрос?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={deleteQuestion} loading={loading}>Удалить</Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>Отмена</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizQuestionManagement; 
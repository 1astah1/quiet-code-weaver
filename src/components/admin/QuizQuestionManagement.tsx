import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';

interface QuizQuestion {
  id: string;
  text: string;
  answers: string[];
  correct_answer: string | null;
  difficulty: number | null;
  category: string | null;
  image_url?: string | null;
  created_at?: string | null;
}

interface QuizQuestionForm {
  text: string;
  answers: string[];
  correct_answer: string;
  difficulty: number;
  category: string;
  image_url?: string;
}

const defaultForm: QuizQuestionForm = {
  text: '',
  answers: ['', '', '', ''],
  correct_answer: '',
  difficulty: 1,
  category: 'cs2',
  image_url: '',
};

const QuizQuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<QuizQuestionForm>(defaultForm);
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
      setForm({
        text: q.text,
        answers: Array.isArray(q.answers) ? q.answers : ['', '', '', ''],
        correct_answer: q.correct_answer || '',
        difficulty: q.difficulty || 1,
        category: q.category || 'cs2',
        image_url: q.image_url || '',
      });
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
      text: form.text,
      answers: form.answers,
      correct_answer: form.correct_answer,
      difficulty: Number(form.difficulty) || 1,
      category: form.category,
      image_url: form.image_url || null,
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
  const handleFormChange = (field: keyof QuizQuestionForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  const handleAnswerChange = (idx: number, value: string) => {
    setForm((prev) => ({ 
      ...prev, 
      answers: prev.answers.map((a, i) => (i === idx ? value : a)) 
    }));
  };

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <Card className="mb-6 p-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Вопросы викторины</h2>
        <Button onClick={() => openForm()}>Добавить вопрос</Button>
      </Card>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 p-2 text-left">Вопрос</th>
              <th className="border border-gray-300 p-2 text-left">Картинка (URL)</th>
              <th className="border border-gray-300 p-2 text-left">Категория</th>
              <th className="border border-gray-300 p-2 text-left">Сложность</th>
              <th className="border border-gray-300 p-2 text-left">Действия</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id}>
                <td className="border border-gray-300 p-2">{q.text}</td>
                <td className="border border-gray-300 p-2 text-xs truncate max-w-xs">{q.image_url || 'Нет'}</td>
                <td className="border border-gray-300 p-2"><Badge>{q.category || 'general'}</Badge></td>
                <td className="border border-gray-300 p-2">{q.difficulty || 1}</td>
                <td className="border border-gray-300 p-2">
                  <Button size="sm" onClick={() => openForm(q)} className="mr-2">
                    Редактировать
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setDeleteId(q.id)}>
                    Удалить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Диалог добавления/редактирования */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogTitle>{editId ? 'Редактировать вопрос' : 'Добавить вопрос'}</DialogTitle>
          <div className="space-y-3">
            <div>
              <Label htmlFor="question">Вопрос</Label>
              <Input
                id="question"
                value={form.text}
                onChange={(e) => handleFormChange('text', e.target.value)}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {form.answers.map((a, i) => (
                <div key={i}>
                  <Label htmlFor={`answer-${i}`}>Вариант {i + 1}</Label>
                  <Input
                    id={`answer-${i}`}
                    value={a}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
            
            <div>
              <Label htmlFor="correct">Правильный ответ (точно как в вариантах)</Label>
              <Input
                id="correct"
                value={form.correct_answer}
                onChange={(e) => handleFormChange('correct_answer', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="category">Категория</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => handleFormChange('category', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="difficulty">Сложность</Label>
              <Input
                id="difficulty"
                type="number"
                min={1}
                max={5}
                value={form.difficulty}
                onChange={(e) => handleFormChange('difficulty', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="image">Ссылка на картинку (опционально)</Label>
              <Input
                id="image"
                value={form.image_url}
                onChange={(e) => handleFormChange('image_url', e.target.value)}
              />
            </div>
            
            {form.image_url && (
              <div className="flex flex-col items-center mt-2">
                <span className="text-xs text-slate-400 mb-1">Предпросмотр картинки:</span>
                <img
                  src={form.image_url}
                  alt="preview"
                  className="max-h-40 rounded-lg border border-slate-200 shadow"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={saveQuestion} disabled={loading}>
              {editId ? 'Сохранить' : 'Добавить'}
            </Button>
            <Button variant="ghost" onClick={() => setShowDialog(false)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Диалог удаления */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogTitle>Удалить вопрос?</DialogTitle>
          <div>Вы уверены, что хотите удалить этот вопрос?</div>
          <DialogFooter>
            <Button variant="destructive" onClick={deleteQuestion} disabled={loading}>
              Удалить
            </Button>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuizQuestionManagement;

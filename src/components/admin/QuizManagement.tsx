import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, PlusCircle, Edit, Save, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// Types to match our DB schema
interface Answer {
  id?: string;
  answer_text: string;
  is_correct: boolean;
  quiz_id?: string;
}

interface Quiz {
  id: string;
  question_text: string;
  image_url: string | null;
  active: boolean;
  answers: Answer[];
}

const QuizManagement = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuiz, setEditingQuiz] = useState<Partial<Quiz> | null>(null);

  const fetchQuizzes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        answers:quiz_answers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Ошибка при загрузке вопросов: ' + error.message);
    } else {
      setQuizzes(data as any);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleSave = async () => {
    if (!editingQuiz || !editingQuiz.question_text) {
      toast.error('Текст вопроса не может быть пустым.');
      return;
    }

    const quizData = {
        question_text: editingQuiz.question_text,
        image_url: editingQuiz.image_url,
        active: editingQuiz.active ?? true,
    }

    let quizId = editingQuiz.id;

    // Upsert quiz question
    if (quizId) { // Editing existing
        const { error } = await supabase.from('quizzes').update(quizData).eq('id', quizId);
        if (error) return toast.error('Ошибка обновления вопроса: ' + error.message);
    } else { // Creating new
        const { data, error } = await supabase.from('quizzes').insert(quizData).select('id').single();
        if (error) return toast.error('Ошибка создания вопроса: ' + error.message);
        quizId = data!.id;
    }

    // Upsert answers
    if (editingQuiz.answers) {
        const answersToUpsert = editingQuiz.answers.map(a => ({
            id: a.id?.startsWith('new-') ? undefined : a.id,
            quiz_id: quizId,
            answer_text: a.answer_text,
            is_correct: a.is_correct
        }));
        const { error: ansError } = await supabase.from('quiz_answers').upsert(answersToUpsert);
        if (ansError) return toast.error('Ошибка сохранения ответов: ' + ansError.message);
    }

    toast.success('Вопрос успешно сохранен!');
    setEditingQuiz(null);
    fetchQuizzes();
  };

  const handleDelete = async (quizId: string) => {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (error) {
          toast.error('Ошибка удаления: ' + error.message);
      } else {
          toast.success('Вопрос удален.');
          fetchQuizzes();
      }
  }

  const handleAnswerChange = (qIndex: number, aIndex: number, field: keyof Answer, value: any) => {
    if (!editingQuiz) return;
    const updatedAnswers = [...(editingQuiz.answers || [])];
    updatedAnswers[aIndex] = { ...updatedAnswers[aIndex], [field]: value };
    setEditingQuiz({ ...editingQuiz, answers: updatedAnswers });
  };
    
  const addAnswer = () => {
    if (!editingQuiz) return;
    const newAnswer: Answer = { id: `new-${Date.now()}`, answer_text: '', is_correct: false };
    setEditingQuiz({ ...editingQuiz, answers: [...(editingQuiz.answers || []), newAnswer] });
  };

  const removeAnswer = async (answerId: string) => {
    if (!editingQuiz) return;
    if (answerId.startsWith('new-')) { // it's a new, unsaved answer
        const updatedAnswers = editingQuiz.answers?.filter(a => a.id !== answerId);
        setEditingQuiz({ ...editingQuiz, answers: updatedAnswers });
    } else { // it's a saved answer, delete from DB
        const { error } = await supabase.from('quiz_answers').delete().eq('id', answerId);
        if (error) {
            toast.error("Ошибка удаления ответа: " + error.message);
        } else {
            const updatedAnswers = editingQuiz.answers?.filter(a => a.id !== answerId);
            setEditingQuiz({ ...editingQuiz, answers: updatedAnswers });
            toast.success("Ответ удален.");
        }
    }
  }

  const renderEditForm = () => {
    if (!editingQuiz) return null;
    return (
        <Dialog open={!!editingQuiz} onOpenChange={(isOpen) => !isOpen && setEditingQuiz(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{editingQuiz.id ? 'Редактировать вопрос' : 'Новый вопрос'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Input
                        placeholder="Текст вопроса"
                        value={editingQuiz.question_text || ''}
                        onChange={(e) => setEditingQuiz({ ...editingQuiz, question_text: e.target.value })}
                    />
                    <Input
                        placeholder="URL изображения (необязательно)"
                        value={editingQuiz.image_url || ''}
                        onChange={(e) => setEditingQuiz({ ...editingQuiz, image_url: e.target.value })}
                    />
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="active"
                            checked={editingQuiz.active ?? true}
                            onCheckedChange={(checked) => setEditingQuiz({ ...editingQuiz, active: !!checked })}
                        />
                        <label htmlFor="active">Активный</label>
                    </div>

                    <h3 className="font-bold">Ответы:</h3>
                    <div className='space-y-2'>
                        {editingQuiz.answers?.map((ans, aIndex) => (
                            <div key={ans.id} className="flex items-center gap-2">
                                <Checkbox
                                    checked={ans.is_correct}
                                    onCheckedChange={(checked) => handleAnswerChange(0, aIndex, 'is_correct', !!checked)}
                                />
                                <Input
                                    placeholder="Текст ответа"
                                    value={ans.answer_text}
                                    onChange={(e) => handleAnswerChange(0, aIndex, 'answer_text', e.target.value)}
                                />
                                <Button variant="destructive" size="icon" onClick={() => removeAnswer(ans.id!)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                     <Button onClick={addAnswer} variant="outline" size="sm">
                        <PlusCircle className="w-4 h-4 mr-2" /> Добавить ответ
                    </Button>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setEditingQuiz(null)}>Отмена</Button>
                    <Button onClick={handleSave}>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Управление викториной</h1>
        <Button onClick={() => setEditingQuiz({ question_text: '', image_url: '', active: true, answers: [] })}>
            <PlusCircle className="w-4 h-4 mr-2"/>
            Новый вопрос
        </Button>
      </div>

      {loading && <p>Загрузка...</p>}

      <div className="space-y-4">
        {quizzes.map((quiz, qIndex) => (
          <Card key={quiz.id}>
            <CardHeader className='flex flex-row items-center justify-between'>
              <CardTitle className='text-lg'>{quiz.question_text}</CardTitle>
              <div className='flex items-center gap-2'>
                <Button variant="outline" size="icon" onClick={() => setEditingQuiz(JSON.parse(JSON.stringify(quiz)))}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="destructive" size="icon"><Trash2 className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                        <DialogTitle>Вы уверены?</DialogTitle>
                        <DialogDescription>
                            Это действие нельзя отменить. Вопрос и все его ответы будут удалены навсегда.
                        </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="secondary" >Отмена</Button>
                            <Button variant="destructive" onClick={() => handleDelete(quiz.id)}>Удалить</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {quiz.image_url && <img src={quiz.image_url} alt="quiz visual" className="max-h-40 rounded my-2" />}
              <ul className="list-disc pl-5">
                {quiz.answers.map(ans => (
                  <li key={ans.id} className={ans.is_correct ? 'font-bold text-green-400' : ''}>
                    {ans.answer_text}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      {renderEditForm()}
    </div>
  );
};

export default QuizManagement; 
'use client';

import React, { useState } from 'react';
import {
  Vote,
  Plus,
  Trash2,
  Lock,
  CheckCircle2,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  usePollsQuery,
  useCreatePollMutation,
  useVotePollMutation,
  useClosePollMutation,
  useDeletePollMutation,
} from '../../hooks/use-circle-tools';
import { GroupPollEntity } from '@circle/types';

interface CirclePollViewProps {
  circleId: string;
}

export const CirclePollView: React.FC<CirclePollViewProps> = ({ circleId }) => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [deadline, setDeadline] = useState('');

  const { data: polls = [], isLoading: isLoadingPolls } = usePollsQuery(circleId);

  const createPollMutation = useCreatePollMutation(circleId);
  const votePollMutation = useVotePollMutation(circleId);
  const closePollMutation = useClosePollMutation(circleId);
  const deletePollMutation = useDeletePollMutation(circleId);

  const handleAddOptionField = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOptionField = (idx: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...options];
    updated[idx] = val;
    setOptions(updated);
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((o) => o.trim()).filter((o) => o.length > 0);
    if (!question.trim() || validOptions.length < 2) {
      alert('Vui lòng nhập câu hỏi và tối thiểu 2 lựa chọn');
      return;
    }

    try {
      await createPollMutation.mutateAsync({
        question: question.trim(),
        options: validOptions,
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
      });
      setQuestion('');
      setOptions(['', '']);
      setDeadline('');
      setIsCreateModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi tạo cuộc bình chọn');
    }
  };

  const handleVote = async (pollId: string, optionId: string) => {
    try {
      await votePollMutation.mutateAsync({
        pollId,
        input: { optionId },
      });
    } catch (err: any) {
      alert(err.message || 'Lỗi khi bỏ phiếu');
    }
  };

  const handleClosePoll = async (pollId: string) => {
    if (!confirm('Bạn có chắc chắn muốn đóng cuộc bình chọn này? Thành viên sẽ không thể bỏ phiếu thêm.')) return;
    try {
      await closePollMutation.mutateAsync(pollId);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đóng bình chọn');
    }
  };

  const handleDeletePoll = async (pollId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa cuộc bình chọn này?')) return;
    try {
      await deletePollMutation.mutateAsync(pollId);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xóa bình chọn');
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white dark:bg-circle-dark-bg overflow-hidden">
      {/* Top Header */}
      <div className="px-8 py-6 border-b border-gray-100 dark:border-circle-dark-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Bình chọn nhóm
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Thăm dò ý kiến tập thể và thống nhất quyết định theo thời gian thực
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary-hover text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo bình chọn mới
        </button>
      </div>

      {/* Poll Cards List */}
      <div className="flex-1 overflow-y-auto p-8">
        {isLoadingPolls ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-circle-primary" />
          </div>
        ) : polls.length === 0 ? (
          <div className="h-80 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-gray-200 dark:border-circle-dark-border rounded-3xl bg-gray-50/50 dark:bg-circle-dark-surface/30">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Vote className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white mb-1">
              Chưa có cuộc bình chọn nào trong Vòng tròn
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mb-5">
              Tạo biểu quyết để chọn địa điểm liên hoan, thời gian họp mặt hoặc lấy ý kiến chung nhanh chóng.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-circle-primary hover:bg-circle-primary-hover text-white text-xs font-bold transition-colors shadow-sm"
            >
              Tạo cuộc bình chọn đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {polls.map((poll) => {
              const isExpired = poll.deadline ? new Date() > new Date(poll.deadline) : false;
              const isClosed = poll.isClosed || isExpired;
              const isCreator = poll.createdById && (poll as any).creator?.userId === user?.id;

              return (
                <div
                  key={poll.id}
                  className="rounded-3xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-surface p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header Row */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        {isClosed ? (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-gray-100 dark:bg-circle-dark-hover text-gray-600 dark:text-gray-400 flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Đã kết thúc
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Đang bình chọn
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {poll.totalVotes} lượt vote
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        {!isClosed && (
                          <button
                            onClick={() => handleClosePoll(poll.id)}
                            className="p-1.5 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                            title="Đóng bình chọn"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePoll(poll.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Xóa bình chọn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Question */}
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                      {poll.question}
                    </h3>

                    {/* Options List */}
                    <div className="space-y-3 mb-5">
                      {poll.options.map((opt) => {
                        const isSelected = poll.userVotedOptionId === opt.id;

                        return (
                          <div
                            key={opt.id}
                            onClick={() => !isClosed && handleVote(poll.id, opt.id)}
                            className={`relative overflow-hidden rounded-2xl border p-3.5 transition-all cursor-pointer ${
                              isSelected
                                ? 'border-circle-primary bg-circle-primary/5 dark:bg-circle-primary/10 shadow-sm'
                                : 'border-gray-200 dark:border-circle-dark-border hover:border-gray-300 dark:hover:border-circle-dark-hover bg-gray-50/50 dark:bg-circle-dark-bg/50'
                            } ${isClosed ? 'cursor-default' : ''}`}
                          >
                            {/* Animated Percentage Fill Bar */}
                            <div
                              style={{ width: `${opt.percentage}%` }}
                              className={`absolute top-0 bottom-0 left-0 transition-all duration-500 ease-out opacity-20 pointer-events-none ${
                                isSelected ? 'bg-circle-primary opacity-30' : 'bg-gray-400 dark:bg-gray-500'
                              }`}
                            />

                            <div className="relative z-10 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected
                                      ? 'border-circle-primary bg-circle-primary text-white'
                                      : 'border-gray-300 dark:border-gray-600'
                                  }`}
                                >
                                  {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                </div>
                                <span
                                  className={`text-sm ${
                                    isSelected
                                      ? 'font-bold text-circle-primary dark:text-circle-primary-hover'
                                      : 'font-medium text-gray-800 dark:text-gray-200'
                                  }`}
                                >
                                  {opt.optionText}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-300">
                                <span>{opt.voteCount} phiếu</span>
                                <span className="text-gray-400 dark:text-gray-500 font-normal">
                                  ({opt.percentage}%)
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="pt-3 border-t border-gray-100 dark:border-circle-dark-border/60 flex items-center justify-between text-[11px] text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Tạo bởi {poll.creator?.user?.profile?.displayName || 'Thành viên'}</span>
                    </div>

                    {poll.deadline && (
                      <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>Hạn chót: {new Date(poll.deadline).toLocaleDateString('vi-VN')}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal: Create Poll */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-circle-dark-surface border border-gray-100 dark:border-circle-dark-border rounded-2xl w-full max-w-md p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Tạo Cuộc Bình Chọn Mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Câu hỏi bình chọn
                </label>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ví dụ: Cuối tuần này nhóm mình đi đâu?..."
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white text-sm outline-none focus:border-circle-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Các phương án lựa chọn
                </label>
                <div className="space-y-2">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Phương án ${idx + 1}`}
                        required
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white text-xs outline-none focus:border-circle-primary"
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionField(idx)}
                          className="p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-circle-dark-hover"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOptionField}
                    className="mt-2 text-xs font-bold text-circle-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Thêm lựa chọn
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Hạn chót bình chọn (tùy chọn)
                </label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-circle-dark-border bg-white dark:bg-circle-dark-bg text-gray-900 dark:text-white text-xs outline-none focus:border-circle-primary"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-circle-dark-hover rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createPollMutation.isPending}
                  className="px-5 py-2 text-xs font-bold bg-circle-primary text-white hover:bg-circle-primary-hover rounded-xl shadow-sm"
                >
                  {createPollMutation.isPending ? 'Đang tạo...' : 'Tạo bình chọn'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

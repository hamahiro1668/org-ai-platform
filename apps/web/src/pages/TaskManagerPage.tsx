import { useEffect, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader, Plus, ClipboardList, CheckCircle2, Clock, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../taskmanager/store/index';
import { executeTask, refineResult } from '../taskmanager/ai/executor';
import ExecutiveDashboard from '../taskmanager/components/ExecutiveDashboard';
import TaskInput from '../taskmanager/components/TaskInput';
import AIStatusDisplay from '../taskmanager/components/AIStatusDisplay';
import EmailPanel from '../taskmanager/components/panels/EmailPanel';
import ResearchPanel from '../taskmanager/components/panels/ResearchPanel';
import CodingPanel from '../taskmanager/components/panels/CodingPanel';
import DocumentPanel from '../taskmanager/components/panels/DocumentPanel';
import SchedulePanel from '../taskmanager/components/panels/SchedulePanel';
import { AnalyticsPanel } from '../taskmanager/components/panels/AnalyticsPanel';
import { SNSPanel } from '../taskmanager/components/panels/SNSPanel';
import ProjectResultsPanel from '../taskmanager/components/panels/ProjectResultsPanel';
import { api } from '../services/api';
import type { Task } from '../taskmanager/types/index';

async function queueTaskOnBackend(task: Task): Promise<string | null> {
  const deptMap: Record<string, string> = {
    SALES: 'SALES', MARKETING: 'MARKETING', ACCOUNTING: 'ACCOUNTING', GENERAL: 'GENERAL',
  };
  try {
    const list = await api.get<{ success: boolean; data: { id: string; title: string; status: string }[] }>('/tasks');
    const existing = list.data.data.find((t) => t.title === task.title);
    if (existing) {
      await api.patch(`/tasks/${existing.id}`, { status: 'QUEUED' });
      return existing.id;
    }
    const created = await api.post<{ success: boolean; data: { id: string } }>('/tasks', {
      title: task.title,
      department: deptMap[task.projectId ?? ''] ?? 'GENERAL',
      input: task.rawInput ?? task.title,
      status: 'QUEUED',
    });
    return created.data.data.id;
  } catch {
    return null;
  }
}

interface BackendTask {
  id: string;
  title: string;
  status: string;
  department: string;
  output: string | null;
  createdAt: string;
  logs: { id: string; message: string; level: string; createdAt: string }[];
}

export default function TaskManagerPage() {
  const {
    tasks, projects, executionState, executionQueue, showTaskInput,
    loadAll, addTask, updateTask, deleteTask,
    startExecution, setStep, setResult, setExecutionError,
    clearExecution, advanceQueue, clearQueue, setShowTaskInput,
  } = useStore();

  // バックエンドタスク一覧（LLMから自動生成されたもの）
  const [backendTasks, setBackendTasks] = useState<BackendTask[]>([]);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [taskFilter, setTaskFilter] = useState<'ALL' | 'QUEUED' | 'DONE' | 'FAILED'>('ALL');

  const fetchBackendTasks = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: BackendTask[] }>('/tasks');
      if (res.data.success) setBackendTasks(res.data.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchBackendTasks();
    const interval = setInterval(fetchBackendTasks, 10000);
    return () => clearInterval(interval);
  }, [fetchBackendTasks]);

  const filteredBackendTasks = backendTasks.filter(
    (t) => taskFilter === 'ALL' || t.status === taskFilter,
  );

  useEffect(() => { loadAll(); }, []);

  const handleExecute = async (task: Task) => {
    startExecution(task.id);
    await updateTask(task.id, { status: 'in_progress' });
    const memory = projects.find((p) => p.projectId === task.projectId);
    try {
      const result = await executeTask(task, memory, (role, status) => setStep(role, status));
      setResult(result);
      await updateTask(task.id, { executionResult: result });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '実行中にエラーが発生しました');
    }
  };

  const handleApprove = async () => {
    if (!executionState.activeTaskId) return;
    await updateTask(executionState.activeTaskId, { status: 'done' });
    clearExecution();
  };

  const handleRefinement = async (request: string) => {
    if (!executionState.result || !executionState.activeTaskId) return;
    startExecution(executionState.activeTaskId);
    try {
      const task = tasks.find((t) => t.id === executionState.activeTaskId);
      if (!task) return;
      setStep('executor', 'running');
      const refined = await refineResult(task, executionState.result, request);
      setStep('executor', 'done');
      setResult(refined);
      await updateTask(executionState.activeTaskId, { executionResult: refined });
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '修正中にエラーが発生しました');
    }
  };

  const autoExecutingRef = useRef(false);

  const handleAutoExecute = async (task: Task) => {
    startExecution(task.id);
    await updateTask(task.id, { status: 'in_progress' });
    const memory = projects.find((p) => p.projectId === task.projectId);
    try {
      const result = await executeTask(task, memory, (role, status) => setStep(role, status));
      setResult(result);
      await updateTask(task.id, { executionResult: result, status: 'done' });
      advanceQueue();
      clearExecution();
    } catch (e) {
      setExecutionError(e instanceof Error ? e.message : '実行中にエラーが発生しました');
      clearQueue();
    } finally {
      autoExecutingRef.current = false;
    }
  };

  useEffect(() => {
    if (!executionQueue?.isRunning) return;
    if (executionState.activeTaskId !== null) return;
    if (autoExecutingRef.current) return;
    const { taskIds, currentIndex } = executionQueue;
    if (currentIndex >= taskIds.length) return;
    const nextTask = tasks.find((t) => t.id === taskIds[currentIndex]);
    if (!nextTask) return;
    autoExecutingRef.current = true;
    handleAutoExecute(nextTask);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [executionQueue, executionState.activeTaskId, tasks]);

  const [viewingTask, setViewingTask] = useState<Task | null>(null);

  const [n8nLogs, setN8nLogs] = useState<{ id: string; message: string; level: string; createdAt: string }[]>([]);
  const [n8nBackendId, setN8nBackendId] = useState<string | null>(null);
  const [n8nDone, setN8nDone] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const startLogStream = (backendId: string) => {
    if (wsRef.current) wsRef.current.close();
    const wsBase = import.meta.env.VITE_WS_URL || `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`;
    const wsUrl = `${wsBase}/api/tasks/${backendId}/stream`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data as string) as { type: string; log?: { id: string; message: string; level: string; createdAt: string }; status?: string };
        if (msg.type === 'log' && msg.log) {
          setN8nLogs((prev) => [...prev, msg.log!]);
        } else if (msg.type === 'status' && (msg.status === 'DONE' || msg.status === 'FAILED')) {
          setN8nDone(true);
          ws.close();
        }
      } catch { /* ignore */ }
    };
    ws.onerror = () => ws.close();
  };

  const handleApproveTask = async (task: Task) => {
    await updateTask(task.id, { status: 'ready' });
    setN8nLogs([]);
    setN8nDone(false);
    const backendId = await queueTaskOnBackend(task);
    if (backendId) {
      setN8nBackendId(backendId);
      startLogStream(backendId);
    } else {
      const readyTask = { ...task, status: 'ready' as const };
      handleExecute(readyTask);
    }
  };

  const handleRejectTask = async (task: Task) => {
    await deleteTask(task.id);
  };

  const handleEditTask = async (task: Task, newTitle: string) => {
    await updateTask(task.id, { title: newTitle });
  };

  const isExecuting = executionState.activeTaskId !== null;
  const hasResult = executionState.result !== null;
  const showAIPanel = isExecuting && !hasResult;
  const activeTask = executionState.activeTaskId ? tasks.find((t) => t.id === executionState.activeTaskId) : null;
  const isQueueMode = executionQueue?.isRunning === true;
  const queueCompleted = executionQueue !== null && !executionQueue.isRunning && executionQueue.taskIds.length > 0;
  const showN8nPanel = n8nBackendId !== null;
  const showRightPanel = showAIPanel || hasResult || isQueueMode || queueCompleted || showN8nPanel || (viewingTask !== null && viewingTask.executionResult !== null);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-[#eae8e3] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#E8863A]/10 rounded-2xl flex items-center justify-center">
            <ClipboardList size={18} className="text-[#E8863A]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#2D2D2D]">タスク管理</h2>
            <p className="text-xs text-[#8A8A8A]">チャットから自動生成・承認して実行</p>
          </div>
        </div>
        <motion.button
          onClick={() => setShowTaskInput(true)}
          className="flex items-center gap-2 bg-[#E8863A] hover:bg-[#d6762f] text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition-all shadow-md shadow-orange-200/50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus size={15} />
          新しいタスク
        </motion.button>
      </div>

      {/* Backend Tasks from LLM */}
      {backendTasks.length > 0 && (
        <div className="px-6 py-3 border-b border-[#eae8e3] bg-white/40">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[#2D2D2D]">AI実行タスク ({backendTasks.length})</h3>
            <div className="flex gap-1">
              {(['ALL', 'QUEUED', 'DONE', 'FAILED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setTaskFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                    taskFilter === f
                      ? 'bg-[#E8863A] text-white'
                      : 'bg-white text-[#8A8A8A] hover:bg-gray-100'
                  }`}
                >
                  {f === 'ALL' ? '全て' : f === 'QUEUED' ? '実行中' : f === 'DONE' ? '完了' : '失敗'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredBackendTasks.map((bt) => (
              <motion.div
                key={bt.id}
                className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 cursor-pointer"
                whileHover={{ scale: 1.005 }}
                onClick={() => setExpandedTaskId(expandedTaskId === bt.id ? null : bt.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {bt.status === 'DONE' && <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />}
                    {bt.status === 'QUEUED' && <Clock size={14} className="text-orange-400 flex-shrink-0" />}
                    {bt.status === 'FAILED' && <XCircle size={14} className="text-red-400 flex-shrink-0" />}
                    {bt.status === 'PENDING' && <Clock size={14} className="text-gray-400 flex-shrink-0" />}
                    <span className="text-xs font-medium text-[#2D2D2D] truncate">{bt.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-[#8A8A8A] flex-shrink-0">{bt.department}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#BCBCBC]">{new Date(bt.createdAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}</span>
                    {expandedTaskId === bt.id ? <ChevronUp size={12} className="text-[#BCBCBC]" /> : <ChevronDown size={12} className="text-[#BCBCBC]" />}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedTaskId === bt.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {bt.output && (
                        <div className="mt-2 p-2 bg-gray-50 rounded-xl text-xs text-[#2D2D2D] whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {bt.output.slice(0, 500)}{bt.output.length > 500 ? '...' : ''}
                        </div>
                      )}
                      {bt.logs.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {bt.logs.slice(-5).map((log) => (
                            <div key={log.id} className="text-[10px] text-[#8A8A8A] flex items-center gap-1">
                              <span className={log.level === 'ERROR' ? 'text-red-400' : 'text-[#BCBCBC]'}>●</span>
                              {log.message}
                            </div>
                          ))}
                        </div>
                      )}
                      {!bt.output && bt.logs.length === 0 && (
                        <div className="mt-2 text-[10px] text-[#BCBCBC]">実行結果なし</div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-6 py-5 flex gap-5">
          {/* Dashboard */}
          <div className="flex-1 min-w-0">
            <ExecutiveDashboard
              tasks={tasks}
              onExecute={handleExecute}
              executingTaskId={executionState.activeTaskId}
              onViewResult={(task) => {
                clearExecution();
                clearQueue();
                setViewingTask(task);
              }}
              onApprove={handleApproveTask}
              onReject={handleRejectTask}
              onEdit={handleEditTask}
            />
          </div>

          {/* Right Panel */}
          <AnimatePresence>
            {showRightPanel && (
              <motion.div
                className="w-96 flex-shrink-0 space-y-4"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={{ duration: 0.3 }}
              >
                {isQueueMode && executionQueue && (
                  <div className="bg-white border border-[#E8863A]/20 rounded-3xl p-5 space-y-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                        <Loader size={14} className="text-[#E8863A]" />
                      </motion.div>
                      <span className="text-sm font-bold text-[#E8863A]">
                        自動実行中 ({Math.min(executionQueue.currentIndex + 1, executionQueue.taskIds.length)}/{executionQueue.taskIds.length})
                      </span>
                    </div>
                    <div className="w-full bg-[#f5f5f0] rounded-full h-2">
                      <motion.div
                        className="bg-[#E8863A] h-2 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(executionQueue.currentIndex / executionQueue.taskIds.length) * 100}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                  </div>
                )}

                {/* n8n background execution log panel */}
                {showN8nPanel && (
                  <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {n8nDone ? (
                          <span className="text-xs font-bold text-emerald-600">✅ n8n 実行完了</span>
                        ) : (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}>
                              <Loader size={13} className="text-[#E8863A]" />
                            </motion.div>
                            <span className="text-xs font-bold text-[#E8863A]">n8n バックグラウンド実行中...</span>
                          </>
                        )}
                      </div>
                      <button
                        className="text-xs text-[#BCBCBC] hover:text-[#8A8A8A] font-medium transition-colors"
                        onClick={() => { wsRef.current?.close(); setN8nBackendId(null); setN8nLogs([]); setN8nDone(false); }}
                      >
                        閉じる
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto font-mono scrollbar-hide">
                      {n8nLogs.length === 0 ? (
                        <p className="text-xs text-[#BCBCBC]">n8n からのログを待機中...</p>
                      ) : (
                        n8nLogs.map((log) => (
                          <div key={log.id} className={`text-xs px-3 py-1.5 rounded-xl ${log.level === 'ERROR' ? 'bg-red-50 text-red-700' : log.level === 'WARN' ? 'bg-amber-50 text-amber-700' : 'bg-[#f5f5f0] text-[#8A8A8A]'}`}>
                            <span className="text-[#BCBCBC] mr-1">[{new Date(log.createdAt).toLocaleTimeString()}]</span>
                            {log.message}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTask && (
                  <div className="text-sm font-bold text-[#2D2D2D] px-1">{activeTask.title}</div>
                )}

                {(showAIPanel || hasResult) && (
                  <AIStatusDisplay steps={executionState.steps} error={executionState.error} />
                )}

                {hasResult && executionState.result && !isQueueMode && !queueCompleted && (
                  <>
                    {executionState.result.type === 'email' && executionState.result.email && (
                      <EmailPanel email={executionState.result.email} onRefinement={handleRefinement} onApprove={handleApprove} isRefining={isExecuting && !hasResult} />
                    )}
                    {executionState.result.type === 'coding' && executionState.result.coding && (
                      <CodingPanel coding={executionState.result.coding} onApprove={handleApprove} />
                    )}
                    {executionState.result.type === 'research' && executionState.result.research && (
                      <ResearchPanel research={executionState.result.research} onApprove={handleApprove} />
                    )}
                    {executionState.result.type === 'document' && executionState.result.document && (
                      <DocumentPanel document={executionState.result.document} onRefinement={handleRefinement} onApprove={handleApprove} isRefining={isExecuting && !hasResult} />
                    )}
                    {executionState.result.type === 'schedule' && executionState.result.schedule && (
                      <SchedulePanel schedule={executionState.result.schedule} onApprove={handleApprove} />
                    )}
                    {executionState.result.type === 'analytics' && executionState.result.analytics && (
                      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 shadow-sm">
                        <AnalyticsPanel result={executionState.result.analytics} />
                        <motion.button onClick={handleApprove} className="mt-3 w-full bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs font-semibold py-2.5 rounded-xl transition-all" whileTap={{ scale: 0.97 }}>承認</motion.button>
                      </div>
                    )}
                    {executionState.result.type === 'sns' && executionState.result.sns && (
                      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 shadow-sm">
                        <SNSPanel result={executionState.result.sns} />
                        <motion.button onClick={handleApprove} className="mt-3 w-full bg-[#E8863A] hover:bg-[#d6762f] text-white text-xs font-semibold py-2.5 rounded-xl transition-all" whileTap={{ scale: 0.97 }}>承認</motion.button>
                      </div>
                    )}
                    <button className="text-xs text-[#BCBCBC] hover:text-[#8A8A8A] font-medium w-full text-center py-1 transition-colors" onClick={clearExecution}>閉じる</button>
                  </>
                )}

                {queueCompleted && !isQueueMode && executionQueue && (
                  <ProjectResultsPanel
                    tasks={tasks.filter((t) => executionQueue.taskIds.includes(t.id))}
                    projectName={tasks.find((t) => executionQueue.taskIds.includes(t.id))?.projectId ?? ''}
                    onClose={() => { clearQueue(); clearExecution(); }}
                  />
                )}

                {viewingTask?.executionResult && !isQueueMode && !queueCompleted && !hasResult && (
                  <>
                    <div className="text-sm font-bold text-[#2D2D2D] px-1">{viewingTask.title}</div>
                    {viewingTask.executionResult.type === 'email' && viewingTask.executionResult.email && (
                      <EmailPanel email={viewingTask.executionResult.email} onRefinement={() => {}} onApprove={() => setViewingTask(null)} isRefining={false} />
                    )}
                    {viewingTask.executionResult.type === 'coding' && viewingTask.executionResult.coding && (
                      <CodingPanel coding={viewingTask.executionResult.coding} onApprove={() => setViewingTask(null)} />
                    )}
                    {viewingTask.executionResult.type === 'research' && viewingTask.executionResult.research && (
                      <ResearchPanel research={viewingTask.executionResult.research} onApprove={() => setViewingTask(null)} />
                    )}
                    {viewingTask.executionResult.type === 'document' && viewingTask.executionResult.document && (
                      <DocumentPanel document={viewingTask.executionResult.document} onRefinement={() => {}} onApprove={() => setViewingTask(null)} isRefining={false} />
                    )}
                    {viewingTask.executionResult.type === 'schedule' && viewingTask.executionResult.schedule && (
                      <SchedulePanel schedule={viewingTask.executionResult.schedule} onApprove={() => setViewingTask(null)} />
                    )}
                    {viewingTask.executionResult.type === 'analytics' && viewingTask.executionResult.analytics && (
                      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 shadow-sm">
                        <AnalyticsPanel result={viewingTask.executionResult.analytics} />
                      </div>
                    )}
                    {viewingTask.executionResult.type === 'sns' && viewingTask.executionResult.sns && (
                      <div className="bg-white border border-[#eae8e3] rounded-3xl p-5 shadow-sm">
                        <SNSPanel result={viewingTask.executionResult.sns} />
                      </div>
                    )}
                    <button className="text-xs text-[#BCBCBC] hover:text-[#8A8A8A] font-medium w-full text-center py-1 transition-colors" onClick={() => setViewingTask(null)}>閉じる</button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Task input modal */}
      <AnimatePresence>
        {showTaskInput && (
          <TaskInput onAdd={addTask} onClose={() => setShowTaskInput(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * 免登入演示頁面 — 創智科技 (52人) 體驗
 * 讓用戶一進來就能看到 AI旗艦隊 的運作
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export default function MobileDemoPage() {
  const [, navigate] = useLocation();
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  
  // 獲取演示數據
  const { data: company } = trpc.demo.company.useQuery();
  const { data: departments } = trpc.demo.departments.useQuery();
  const { data: tasks } = trpc.demo.tasks.useQuery({ filter: "all" });
  const { data: agents } = trpc.demo.agents.useQuery(
    selectedDept ? { departmentId: selectedDept } : undefined
  );
  const { data: meetings } = trpc.demo.meetings.useQuery(
    selectedDept ? { departmentId: selectedDept } : undefined
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
              <span className="text-white text-lg">🚀</span>
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">AI旗艦隊</h1>
              <p className="text-xs text-gray-500">體驗模式</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/app")}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium"
          >
            開始使用
          </button>
        </div>
      </div>

      {/* 公司概覽 */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">{company?.name || "創智科技"}</h2>
              <p className="text-white/80 text-sm">{company?.nameEn || "InnoTech Solutions"}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{company?.headcount || 52}</p>
              <p className="text-xs text-white/70">員工人數</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{departments?.length || 7}</p>
              <p className="text-xs text-white/70">部門</p>
            </div>
            <div className="bg-white/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold">{agents?.length || 14}</p>
              <p className="text-xs text-white/70">AI 員工</p>
            </div>
          </div>
        </div>

        {/* 部門列表 */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">選擇部門</h3>
        <div className="grid grid-cols-2 gap-3 mb-6">
          {departments?.map((dept: any) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(selectedDept === dept.id ? null : dept.id)}
              className={`p-4 rounded-xl text-left transition-all ${
                selectedDept === dept.id
                  ? "bg-orange-500 text-white shadow-lg"
                  : "bg-white border border-gray-100 shadow-sm"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl">{dept.icon}</span>
                <span className="font-medium">{dept.name}</span>
              </div>
              <p className={`text-xs ${selectedDept === dept.id ? "text-white/80" : "text-gray-500"}`}>
                {dept.headcount} 人
              </p>
            </button>
          ))}
        </div>

        {/* 選中部門的詳情 */}
        {selectedDept && (
          <>
            {/* AI 員工 */}
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {departments?.find((d: any) => d.id === selectedDept)?.name} AI 員工
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-3 mb-6">
              {agents?.map((agent: any) => (
                <div
                  key={agent.id}
                  className="flex-shrink-0 w-24 bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100"
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 flex items-center justify-center text-2xl">
                    {agent.avatar}
                  </div>
                  <p className="font-medium text-sm truncate">{agent.name}</p>
                  <p className="text-xs text-gray-500 truncate">{agent.title}</p>
                </div>
              ))}
            </div>

            {/* 例行會議 */}
            <h3 className="text-sm font-medium text-gray-500 mb-3">例行會議</h3>
            <div className="space-y-3 mb-6">
              {meetings?.map((meeting: any) => (
                <div
                  key={meeting.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{meeting.title}</h4>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                      {meeting.schedule}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {meeting.outputs.map((output: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {output}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 進行中的任務 */}
        <h3 className="text-sm font-medium text-gray-500 mb-3">任務看板</h3>
        <div className="space-y-3">
          {tasks?.map((task: any) => (
            <div
              key={task.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{task.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : task.status === "in_progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {task.status === "completed" ? "✅ 已完成" 
                    : task.status === "in_progress" ? "🔄 進行中" 
                    : "👀 待審核"}
                </span>
              </div>
              
              {task.stages && (
                <div className="flex gap-1 mb-2">
                  {task.stages.map((stage: any, i: number) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full ${
                        stage.status === "completed"
                          ? "bg-green-500"
                          : stage.status === "in_progress"
                          ? "bg-blue-500"
                          : "bg-gray-200"
                      }`}
                    />
                  ))}
                </div>
              )}
              
              {task.outputs && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {task.outputs.map((output: any, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1"
                    >
                      {output.type === "pdf" && "📄"}
                      {output.type === "xls" && "📊"}
                      {output.type === "ppt" && "📽️"}
                      {output.type === "doc" && "📝"}
                      {output.name}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs text-gray-500">團隊：</span>
                {task.assignedAgents?.map((agent: string, i: number) => (
                  <span key={i} className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                    {agent}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-8 p-5 bg-gradient-to-br from-orange-500 to-rose-500 rounded-2xl text-white text-center">
          <h3 className="text-lg font-bold mb-2">準備好了嗎？</h3>
          <p className="text-sm text-white/80 mb-4">
            讓 AI旗艦隊 為你的公司組建最強團隊
          </p>
          <button
            onClick={() => navigate("/app")}
            className="w-full py-3 bg-white text-orange-600 rounded-xl font-bold"
          >
            免費開始使用
          </button>
        </div>
      </div>
    </div>
  );
}
